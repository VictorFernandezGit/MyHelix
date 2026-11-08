"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExportPdfButton from "@/components/ExportPdfButton";

type Status = "carried" | "not_carried" | "no_call" | "not_on_chip";

type Tier = "strong" | "moderate" | "limited";

type Finding = {
  rsid: string;
  domain: string;
  genotype: string | null;
  status: Status;
  evidence_tier: Tier;
  summary: string;
  citations: string[] | null;
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
  citations: string[] | null;
};

type Loaded = {
  report: ReportRow;
  fileName: string | null;
  findings: Finding[];
  popular: PopularMarker[];
};

const DOMAINS = [
  { key: "memory_retention", label: "Memory & retention" },
  { key: "focus_cognition", label: "Focus & cognition" },
  { key: "stress_resiliency", label: "Stress resiliency" },
  { key: "processing_speed", label: "Processing speed" },
] as const;

const STATUS: Record<
  Status,
  { label: string; classes: string; order: number }
> = {
  carried: {
    label: "Carries variant",
    classes: "bg-violet-50 text-violet-700 ring-violet-200",
    order: 0,
  },
  not_carried: {
    label: "Does not carry",
    classes: "bg-slate-100 text-slate-700 ring-slate-200",
    order: 1,
  },
  no_call: {
    label: "Unreadable",
    classes: "bg-amber-50 text-amber-800 ring-amber-200",
    order: 2,
  },
  not_on_chip: {
    label: "Not tested",
    classes: "bg-slate-50 text-slate-500 ring-slate-200",
    order: 3,
  },
};

const TIER: Record<Tier, { label: string; classes: string; order: number }> = {
  strong: {
    label: "Strong evidence",
    classes: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    order: 0,
  },
  moderate: {
    label: "Moderate evidence",
    classes: "bg-sky-50 text-sky-800 ring-sky-200",
    order: 1,
  },
  limited: {
    label: "Limited evidence",
    classes: "bg-orange-50 text-orange-800 ring-orange-200",
    order: 2,
  },
};

function Badge({ label, classes }: { label: string; classes: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {label}
    </span>
  );
}

function Citations({ citations }: { citations: string[] | null }) {
  const ids = (citations ?? []).filter((id) =>
    /^\s*(?:PMID:)?\d+\s*$/.test(id),
  );

  if (!ids.length) return null;

  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {ids.map((id) => {
        const pmid = id.replace("PMID:", "").trim();

        return (
          <a
            key={id}
            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-700 underline underline-offset-2"
          >
            PMID: {pmid}
          </a>
        );
      })}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-400 bg-white p-5">
      <dt className="text-sm text-slate-500">{label}</dt>

      <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </dd>

      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a
            href={`https://www.ncbi.nlm.nih.gov/snp/${encodeURIComponent(finding.rsid)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
          >
            {finding.rsid}
          </a>

          <p className="mt-1 text-xs text-slate-500">
            Genotype:{" "}
            <span className="font-mono text-slate-700">
              {finding.genotype ?? "Unavailable"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            label={STATUS[finding.status].label}
            classes={STATUS[finding.status].classes}
          />

          <Badge
            label={TIER[finding.evidence_tier].label}
            classes={TIER[finding.evidence_tier].classes}
          />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{finding.summary}</p>

      <Citations citations={finding.citations} />
    </li>
  );
}

export default function ReportDashboard() {
  const params = useSearchParams();
  const uploadId = params.get("upload");

  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Please sign in to view your report.");
        }

        let query = supabase
          .from("reports")
          .select(
            "upload_id, snps_in_file, call_rate, panel_found, panel_total, created_at",
          );

        query = uploadId
          ? query.eq("upload_id", uploadId)
          : query.order("created_at", { ascending: false }).limit(1);

        const { data: rows, error: reportError } = await query;

        if (reportError) throw reportError;

        if (!rows?.length) {
          throw new Error(
            "No report found. Upload a supported DNA file first.",
          );
        }

        const report = rows[0] as ReportRow;

        const [findingsResult, uploadResult, popularResult] = await Promise.all(
          [
            supabase
              .from("report_findings")
              .select(
                "rsid, domain, genotype, status, evidence_tier, summary, citations",
              )
              .eq("upload_id", report.upload_id),

            supabase
              .from("uploads")
              .select("file_name")
              .eq("id", report.upload_id)
              .maybeSingle(),

            supabase
              .from("report_popular_markers")
              .select(
                "rsid, gene, domain, genotype, common_claim, evidence_note, citations",
              )
              .eq("upload_id", report.upload_id)
              .order("gene"),
          ],
        );

        if (findingsResult.error) {
          throw findingsResult.error;
        }

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        // Optional table may not be deployed yet.
        if (active) {
          setData({
            report,
            fileName: uploadResult.data?.file_name ?? null,
            findings: (findingsResult.data ?? []) as Finding[],
            popular: popularResult.error
              ? []
              : ((popularResult.data ?? []) as PopularMarker[]),
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load report.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [uploadId]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-slate-500">
        Loading your genetic report...
      </p>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          {error ?? "Report unavailable."}
        </p>

        <Link
          href="/upload"
          className="mt-3 inline-block text-sm font-medium text-blue-700 underline"
        >
          Go to upload
        </Link>
      </div>
    );
  }

  const { report, fileName, findings, popular } = data;

  const carried = findings.filter((f) => f.status === "carried").length;

  const ordered = [...findings].sort(
    (a, b) =>
      STATUS[a.status].order - STATUS[b.status].order ||
      TIER[a.evidence_tier].order - TIER[b.evidence_tier].order ||
      a.rsid.localeCompare(b.rsid),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            MyHelix report
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Your genetic overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {fileName ?? "Uploaded DNA file"} ·{" "}
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/upload"
            className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Upload another file
          </Link>

          <ExportPdfButton />
        </div>
      </header>

      {/* Report Statistics */}
      <section aria-label="File summary">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryStat
            label="SNPs in file"
            value={report.snps_in_file.toLocaleString()}
          />

          <SummaryStat
            label="Call rate"
            value={`${Number(report.call_rate).toFixed(2)}%`}
          />

          <SummaryStat
            label="Panel coverage"
            value={`${report.panel_found} / ${report.panel_total}`}
            hint="Panel variants read from file"
          />

          <SummaryStat
            label="Variants carried"
            value={String(carried)}
            hint="Matching the panel's allele criteria"
          />
        </dl>
      </section>

      {/* Research Findings */}
      <section aria-labelledby="findings-heading" className="space-y-5">
        <div>
          <h2
            id="findings-heading"
            className="text-xl font-semibold text-slate-900"
          >
            Research findings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Variants are grouped by research domain, not scored as individual
            abilities or diagnoses.
          </p>
        </div>

        {DOMAINS.map((domain) => {
          const group = ordered.filter((f) => f.domain === domain.key);

          const assessed = group.filter(
            (f) => f.status === "carried" || f.status === "not_carried",
          ).length;

          return (
            <section
              key={domain.key}
              className="rounded-2xl border border-slate-200 bg-slate-200/50 p-4 sm:p-5"
              aria-label={domain.label}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {domain.label}
                </h3>

                <p className="text-xs text-slate-500">
                  {assessed} assessed · {group.length} panel entries
                </p>
              </div>

              {group.length ? (
                <ul className="grid gap-3 lg:grid-cols-2">
                  {group.map((f) => (
                    <FindingCard key={`${domain.key}-${f.rsid}`} finding={f} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No panel findings in this domain.
                </p>
              )}
            </section>
          );
        })}
      </section>

      {/* Popular Markers */}
      {popular.length > 0 && (
        <section
          aria-labelledby="popular-heading"
          className="rounded-2xl border border-slate-400 bg-white p-5"
        >
          <h2
            id="popular-heading"
            className="text-xl font-semibold text-slate-900"
          >
            Popular markers: research context
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Common consumer-DNA claims shown separately from the curated panel
            findings.
          </p>

          <ul className="mt-4 divide-y divide-slate-300">
            {popular.map((marker) => (
              <li key={marker.rsid} className="py-6 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-slate-900">
                    {marker.gene}
                  </strong>

                  <span className="font-mono text-xs text-slate-500">
                    {marker.rsid}
                  </span>

                  <span className="text-xs text-slate-500">
                    {marker.genotype ?? "No genotype"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">
                  <strong>Common claim:</strong> {marker.common_claim}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  <strong>Research context:</strong> {marker.evidence_note}
                </p>

                <Citations citations={marker.citations} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Disclaimer */}
      <p
        role="note"
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
      >
        <strong>Educational use only.</strong> Genetic associations do not
        reliably predict an individual&apos;s cognitive abilities, mental
        health, or medical outcomes. This report is not a diagnosis or medical
        advice.
      </p>
    </div>
  );
}
