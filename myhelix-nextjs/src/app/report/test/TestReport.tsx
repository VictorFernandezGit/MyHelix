// pulls the report for an upload from supabase, or your latest one if theres no ?upload= in the url
// then lays it out by domain
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "carried" | "not_carried" | "no_call" | "not_on_chip";
type Tier = "strong" | "moderate" | "limited";

type Finding = {
  rsid: string;
  domain: string;
  genotype: string | null;
  status: Status;
  evidence_tier: Tier;
  summary: string;
  citations: string[];
};

type ReportRow = {
  upload_id: string;
  snps_in_file: number;
  call_rate: number;
  panel_found: number;
  panel_total: number;
  created_at: string;
};

type PopularMarker = {
  rsid: string;
  gene: string;
  domain: string;
  genotype: string | null;
  common_claim: string;
  evidence_note: string;
  citations: string[];
};

type Loaded = { report: ReportRow; fileName: string | null; findings: Finding[]; popular: PopularMarker[] };

const DOMAINS = [
  { key: "memory_retention", label: "Memory & retention" },
  { key: "focus_cognition", label: "Focus & cognition" },
  { key: "stress_resiliency", label: "Stress resiliency" },
  { key: "processing_speed", label: "Processing speed" },
];

const STATUS: Record<Status, { label: string; className: string; order: number }> = {
  carried: { label: "Carries variant", className: "bg-violet-100 text-violet-800 ring-violet-200", order: 0 },
  not_carried: { label: "Does not carry", className: "bg-slate-100 text-slate-700 ring-slate-200", order: 1 },
  no_call: { label: "Unreadable", className: "bg-amber-50 text-amber-800 ring-amber-200", order: 2 },
  not_on_chip: { label: "Not tested", className: "bg-white text-slate-500 ring-slate-200", order: 3 },
};

const TIER: Record<Tier, { label: string; className: string; order: number }> = {
  strong: { label: "Strong", className: "bg-emerald-100 text-emerald-800 ring-emerald-200", order: 0 },
  moderate: { label: "Moderate", className: "bg-sky-100 text-sky-800 ring-sky-200", order: 1 },
  limited: { label: "Limited", className: "bg-orange-50 text-orange-800 ring-orange-200", order: 2 },
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Citations({ citations }: { citations: string[] }) {
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-1">
      {citations.map((c) => {
        const pmid = c.replace("PMID:", "");
        return (
          <a
            key={c}
            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
          >
            {c}
          </a>
        );
      })}
    </span>
  );
}

function PopularMarkers({ markers }: { markers: PopularMarker[] }) {
  const label = (key: string) => DOMAINS.find((d) => d.key === key)?.label ?? key;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Markers you may have heard of</h2>
        <p className="mt-1 text-sm text-slate-500">
          These show up in many consumer DNA reports. Large studies have not confirmed the effects they are known for, so
          they are not part of your results above.
        </p>
      </header>
      <ul className="divide-y divide-slate-100">
        {markers.map((m) => (
          <li key={m.rsid} className="grid gap-3 px-5 py-4 md:grid-cols-[9rem_5rem_1fr] md:items-start">
            <div>
              <p className="text-sm font-semibold text-slate-900">{m.gene}</p>
              <a
                href={`https://www.ncbi.nlm.nih.gov/snp/${m.rsid}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-slate-500 hover:underline"
              >
                {m.rsid}
              </a>
            </div>
            <div className="font-mono text-sm text-slate-700">
              <span className="text-xs text-slate-400 md:hidden">Genotype </span>
              {m.genotype ?? "—"}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge label="Not supported by large studies" className="bg-slate-100 text-slate-600 ring-slate-200" />
                <span className="text-xs text-slate-500">{label(m.domain)}</span>
              </div>
              <p className="text-sm text-slate-700">
                <span className="font-medium">Often claimed:</span> {m.common_claim}.
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-medium">What large studies show:</span> {m.evidence_note}
              </p>
              <Citations citations={m.citations} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// carried first, then by evidence, then rsid so the order is always the same
function sortFindings(findings: Finding[]) {
  return [...findings].sort(
    (a, b) =>
      STATUS[a.status].order - STATUS[b.status].order ||
      TIER[a.evidence_tier].order - TIER[b.evidence_tier].order ||
      a.rsid.localeCompare(b.rsid),
  );
}

function DomainSection({ label, findings }: { label: string; findings: Finding[] }) {
  const carried = findings.filter((f) => f.status === "carried").length;
  const found = findings.filter((f) => f.status === "carried" || f.status === "not_carried").length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        <p className="text-sm text-slate-500">
          Carries {carried} of {found} assessed variant{found === 1 ? "" : "s"}
        </p>
      </header>

      {findings.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500">No panel variants in this domain yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {sortFindings(findings).map((f) => (
            <li key={f.rsid} className="grid gap-3 px-5 py-4 md:grid-cols-[9rem_5rem_9rem_1fr] md:items-start">
              <div>
                <a
                  href={`https://www.ncbi.nlm.nih.gov/snp/${f.rsid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm font-medium text-slate-900 hover:underline"
                >
                  {f.rsid}
                </a>
              </div>
              <div className="font-mono text-sm text-slate-700">
                <span className="text-xs text-slate-400 md:hidden">Genotype </span>
                {f.genotype ?? "—"}
              </div>
              <div className="flex flex-wrap gap-1.5 md:flex-col md:items-start">
                <Badge {...STATUS[f.status]} />
                <Badge label={`${TIER[f.evidence_tier].label} evidence`} className={TIER[f.evidence_tier].className} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm leading-relaxed text-slate-700">{f.summary}</p>
                <Citations citations={f.citations} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TestReport() {
  const params = useSearchParams();
  const uploadParam = params.get("upload");
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Log in to see your report.");
        return;
      }

      let query = supabase
        .from("reports")
        .select("upload_id, snps_in_file, call_rate, panel_found, panel_total, created_at");
      query = uploadParam
        ? query.eq("upload_id", uploadParam)
        : query.order("created_at", { ascending: false }).limit(1);
      const { data: reports, error: reportError } = await query;
      if (reportError || !reports?.length) {
        setError(reportError?.message ?? "No report found. Upload a file first.");
        return;
      }
      const report = reports[0] as ReportRow;

      const [{ data: findings, error: findingsError }, { data: upload }, { data: popular }] = await Promise.all([
        supabase
          .from("report_findings")
          .select("rsid, domain, genotype, status, evidence_tier, summary, citations")
          .eq("upload_id", report.upload_id),
        supabase.from("uploads").select("file_name").eq("id", report.upload_id).maybeSingle(),
        supabase
          .from("report_popular_markers")
          .select("rsid, gene, domain, genotype, common_claim, evidence_note, citations")
          .eq("upload_id", report.upload_id)
          .order("gene"),
      ]);
      if (findingsError) {
        setError(findingsError.message);
        return;
      }
      setData({
        report,
        fileName: upload?.file_name ?? null,
        findings: (findings ?? []) as Finding[],
        popular: (popular ?? []) as PopularMarker[],
      });
    }
    load();
  }, [uploadParam]);

  if (error) {
    return (
      <div className="rounded-3xl border border-slate-200 p-6 text-sm text-slate-600">
        {error}{" "}
        <Link href="/upload" className="font-medium text-slate-900 underline">
          Go to upload
        </Link>
      </div>
    );
  }
  if (!data) return <p className="p-6 text-sm text-slate-500">Loading report...</p>;

  const { report, fileName, findings, popular } = data;
  const carried = findings.filter((f) => f.status === "carried").length;
  const created = new Date(report.created_at).toLocaleString();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Test report</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Your cognition panel results</h1>
          <p className="mt-1 text-sm text-slate-500">
            {fileName ?? "Uploaded file"} · {created}
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Upload another file
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="SNPs in file" value={report.snps_in_file.toLocaleString()} />
        <Stat label="Call rate" value={`${Number(report.call_rate).toFixed(2)}%`} />
        <Stat
          label="Panel coverage"
          value={`${report.panel_found} / ${report.panel_total}`}
          hint="panel variants read from your file"
        />
        <Stat label="Variants carried" value={String(carried)} hint={`of ${report.panel_found} assessed`} />
      </div>

      {DOMAINS.map((d) => (
        <DomainSection key={d.key} label={d.label} findings={findings.filter((f) => f.domain === d.key)} />
      ))}

      {/* hidden if the popular markers table isnt set up yet */}
      {popular.length > 0 && <PopularMarkers markers={popular} />}

      <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        Educational use only. Each result is a statistical association from published genome-wide studies (GWAS
        Catalog); effects are small and don&apos;t predict anything about you individually. Not a medical or diagnostic
        test. &quot;Carries variant&quot; means at least one copy of the allele the studies linked to the trait.
      </p>
    </div>
  );
}
