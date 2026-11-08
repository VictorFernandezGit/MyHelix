"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Focus,
  HeartPulse,
  Zap,
  ChevronDown,
  Info,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BackgroundGuide from "./BackgroundGuide";

type Status = "carried" | "not_carried" | "no_call" | "not_on_chip";
type EvidenceTier = "strong" | "moderate" | "limited";

type Finding = {
  rsid: string;
  domain: string;
  genotype: string | null;
  status: Status;
  evidence_tier: EvidenceTier;
  summary: string;
  citations: string[] | null;
};

type Report = {
  upload_id: string;
  created_at: string;
};

type Domain = {
  key: string;
  name: string;
  subtitle: string;
  description: string;
  limitation: string;
  icon: LucideIcon;
};

const DOMAINS: Domain[] = [
  {
    key: "memory_retention",
    name: "Memory & retention",
    subtitle: "How we remember information",
    description:
      "Researchers study how genetic variation may relate to learning, memory formation, and the ability to recall information.",
    limitation:
      "Your DNA cannot determine how good your memory is. Sleep, learning strategies, health, and environment also matter.",
    icon: Brain,
  },
  {
    key: "focus_cognition",
    name: "Focus & cognition",
    subtitle: "Attention, learning, and thinking",
    description:
      "This research area explores genetic associations involving attention, cognitive processes, and learning.",
    limitation:
      "These variants cannot measure intelligence, determine your ability to focus, or diagnose ADHD.",
    icon: Focus,
  },
  {
    key: "stress_resiliency",
    name: "Stress resiliency",
    subtitle: "Understanding stress responses",
    description:
      "Researchers investigate genetic variation in biological pathways that may be associated with stress responses.",
    limitation:
      "Your genetics alone cannot predict how well you handle stress or whether you will develop a mental health condition.",
    icon: HeartPulse,
  },
  {
    key: "processing_speed",
    name: "Processing speed",
    subtitle: "How quickly information is processed",
    description:
      "This area examines research on genetic variation and the speed of certain cognitive processes.",
    limitation:
      "These associations cannot tell you how quickly you think or how well you will perform on cognitive tasks.",
    icon: Zap,
  },
];

const STATUS_LABELS: Record<Status, string> = {
  carried: "Variant detected",
  not_carried: "Variant not detected",
  no_call: "Could not read",
  not_on_chip: "Not included in DNA file",
};

const TIER_STYLES: Record<EvidenceTier, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-blue-50 text-blue-700 border-blue-200",
  limited: "bg-amber-50 text-amber-700 border-amber-200",
};

function ResearchLinks({ citations }: { citations: string[] | null }) {
  return (
    <div className="flex flex-wrap gap-3">
      {(citations ?? [])
        .map((citation) => {
          const match = citation.match(/^(?:PMID:)?\s*(\d+)$/i);
          return match?.[1] ?? null;
        })
        .filter((id): id is string => Boolean(id))
        .map((pmid) => (
          <a
            key={pmid}
            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
          >
            Research study: {pmid}
            <ArrowUpRight size={13} />
          </a>
        ))}
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);

  const readable =
    finding.status === "carried" || finding.status === "not_carried";

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-md font-semibold text-slate-900">
            Genetic marker{" "}
            <span className="px-2 bg-orange-300 rounded-3xl">
              {finding.rsid}
            </span>
          </p>
          <p className="mt-1 text-md text-slate-700 underline underline-offset-2">
            {STATUS_LABELS[finding.status]}
          </p>
        </div>

        <span
          className={`rounded-full border-2 px-2.5 py-1 text-md font-medium ${
            TIER_STYLES[finding.evidence_tier]
          }`}
        >
          {finding.evidence_tier} evidence
        </span>
      </div>

      <div className="mt-4 text-md leading-7 text-slate-700">
        {readable ? (
          <div>
            <span className="font-bold text-black">Summary: </span>
            <span>{finding.summary}</span>
          </div>
        ) : (
          "This marker could not be evaluated from your uploaded DNA file. No individual finding can be inferred for this marker."
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-4 px-4 py-2 bg-blue-100 rounded-md flex items-center gap-2 text-md font-bold text-blue-500 hover:text-blue-900 hover:bg-blue-200 transition-colors"
      >
        {expanded ? "Hide scientific details" : "Understand the science"}
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-400 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="px-4 py-2 bg-amber-200 rounded-md">
              <p className="text-lg text-slate-900">Variant ID</p>
              <p className="text-md mt-1 font-mono">{finding.rsid}</p>
            </div>
            <div className="px-4 py-2 bg-amber-200 rounded-md">
              <p className="text-lg text-slate-900">Your genotype</p>
              <p className="text-md mt-1 font-mono">
                {finding.genotype ?? "Unavailable"}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-3 text-md leading-6 text-slate-600">
            <p className="font-medium text-slate-800">
              What does the evidence level mean?
            </p>
            <p className="mt-1">
              {finding.evidence_tier === "strong"
                ? "The research association has stronger supporting evidence under the MyHelix panel's classification."
                : finding.evidence_tier === "moderate"
                  ? "Some research supports this association, but important uncertainty remains."
                  : "The available evidence is preliminary, inconsistent, or limited."}
            </p>
          </div>

          <ResearchLinks citations={finding.citations} />
        </div>
      )}
    </div>
  );
}

export default function TraitsPage() {
  const searchParams = useSearchParams();
  const uploadId = searchParams.get("upload");

  const [selected, setSelected] = useState(DOMAINS[0].key);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      setFindings([]);
      setReportId(null);

      try {
        const supabase = createClient();

        const { data: auth, error: authError } = await supabase.auth.getUser();

        if (authError || !auth.user) {
          throw new Error("Please sign in to view your traits.");
        }

        let query = supabase.from("reports").select("upload_id, created_at");

        query = uploadId
          ? query.eq("upload_id", uploadId)
          : query.order("created_at", { ascending: false }).limit(1);

        const { data: reports, error: reportError } = await query;

        if (reportError) throw reportError;

        const report = (reports?.[0] ?? null) as Report | null;

        if (!report) {
          throw new Error(
            "No completed genetic report found. Upload a DNA file first.",
          );
        }

        const { data, error: findingsError } = await supabase
          .from("report_findings")
          .select(
            "rsid, domain, genotype, status, evidence_tier, summary, citations",
          )
          .eq("upload_id", report.upload_id);

        if (findingsError) throw findingsError;

        if (active) {
          setReportId(report.upload_id);
          setFindings((data ?? []) as Finding[]);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your genetic findings.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [uploadId]);

  const selectedDomain = DOMAINS.find((domain) => domain.key === selected)!;

  const domainFindings = findings.filter(
    (finding) => finding.domain === selected,
  );

  const assessedCount = domainFindings.filter(
    (finding) =>
      finding.status === "carried" || finding.status === "not_carried",
  ).length;

  const Icon = selectedDomain.icon;

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading your genetic traits...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">{error}</p>
        <Link
          href="/upload"
          className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Upload DNA file
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          MyHelix / Traits
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Explore your traits
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-700">
          Discover what researchers have studied about genetic variation and
          human traits. Your results describe genetic markers, not your
          abilities or potential.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DOMAINS.map((domain) => {
          const DomainIcon = domain.icon;
          const count = findings.filter(
            (finding) => finding.domain === domain.key,
          ).length;

          return (
            <button
              key={domain.key}
              type="button"
              onClick={() => setSelected(domain.key)}
              aria-pressed={selected === domain.key}
              className={`rounded-3xl border-2 p-5 text-left transition-colors ${
                selected === domain.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-400 bg-white text-slate-900 hover:border-slate-900 hover:border-2"
              }`}
            >
              <DomainIcon size={22} strokeWidth={1.7} />

              <p className="mt-4 text-md font-semibold">{domain.name}</p>

              <p
                className={`mt-1 text-md ${
                  selected === domain.key ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {count} research markers
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border-2 border-slate-400 bg-slate-50/50 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white p-3 text-slate-800 ring-1 ring-slate-200 border-2">
            <Icon size={24} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {selectedDomain.name}
            </h2>
            <p className="mt-1 text-md text-slate-500">
              {selectedDomain.subtitle}
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-xl leading-7 text-green-600">
          {selectedDomain.description}
        </p>

        <div className="mt-5 rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="text-md font-bold text-slate-900">
            Your genetic findings
          </p>
          <p className="mt-1 text-md text-slate-600">
            {assessedCount} of {domainFindings.length} panel markers could be
            evaluated from your DNA file.
          </p>
        </div>

        {/* helping user understand results */}
        <BackgroundGuide />

        <div className="mt-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <p className="text-md font-semibold text-blue-950">
              What this does not tell you
            </p>
            <p className="mt-1 text-lg leading-6 text-blue-800">
              {selectedDomain.limitation}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {domainFindings.length > 0 ? (
            domainFindings.map((finding) => (
              <FindingCard
                key={`${finding.domain}-${finding.rsid}`}
                finding={finding}
              />
            ))
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              No findings are available in this research category.
            </div>
          )}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Educational research information, not medical advice.
        </p>

        {/* <Link
          href={`/report/snps?upload=${encodeURIComponent(reportId!)}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
        >
          Explore all genetic markers
          <ArrowUpRight size={16} />
        </Link> */}
      </footer>
    </main>
  );
}
