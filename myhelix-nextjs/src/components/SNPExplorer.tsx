
"use client";

import { useMemo, useState } from "react";

type Variant = {
  rsid: string;
  domain: string;
  risk_allele: string;
  gene: string;
  chromosome: string;
  position_grch38: number | null;
  position_grch37: number | null;
  n_papers: number;
  max_sample_size: number;
  replicated_papers: number;
  max_replication_size: number;
  best_mlog: number | null;
  effect_sizes: string[];
  pubmed_ids: string[];
  study_accessions: string[];
  traits: string[];
  alleles: string[];
  aliases: string[];
};

const DOMAINS = [
  { id: "all", label: "All research" },
  { id: "memory_retention", label: "Memory" },
  { id: "focus_cognition", label: "Focus & Cognition" },
  { id: "processing_speed", label: "Processing Speed" },
  { id: "stress_resiliency", label: "Stress Resilience" },
];

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  memory_retention:
    "Research investigating genetic associations with memory performance and short-term memory.",
  focus_cognition:
    "Research investigating cognitive measurements, intelligence, and related traits.",
  processing_speed:
    "Research investigating reaction time and measurements related to processing speed.",
  stress_resiliency:
    "Research investigating traits such as neuroticism. These measurements are not direct measures of resilience.",
};

const DOMAIN_NAMES: Record<string, string> = {
  memory_retention: "Memory",
  focus_cognition: "Focus & Cognition",
  processing_speed: "Processing Speed",
  stress_resiliency: "Stress Resilience",
};

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "Not reported";

  return value.toLocaleString("en-US");
}

function VariantCard({ variant }: { variant: Variant }) {
  const [expanded, setExpanded] = useState(false);

  const hasReplication = variant.replicated_papers > 0;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a
            href={`https://www.ncbi.nlm.nih.gov/snp/${variant.rsid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-blue-700 hover:underline"
          >
            {variant.rsid}
          </a>

          <p className="mt-1 text-sm text-gray-600">
            {variant.gene}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {DOMAIN_NAMES[variant.domain] ?? variant.domain}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            hasReplication
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {hasReplication
            ? `${variant.replicated_papers} replicated paper(s)`
            : "No replication recorded"}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900">
          What has been studied?
        </h3>

        <p className="mt-1 text-sm leading-6 text-gray-600">
          This variant has been investigated in research involving{" "}
          {variant.traits.join(", ") || "traits not specified"}.
          The panel records {variant.n_papers} associated paper(s),
          with a maximum reported sample size of{" "}
          {formatNumber(variant.max_sample_size)} participants.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Associated papers"
          value={formatNumber(variant.n_papers)}
        />

        <Metric
          label="Largest sample"
          value={formatNumber(variant.max_sample_size)}
        />

        <Metric
          label="Replicated papers"
          value={formatNumber(variant.replicated_papers)}
        />
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-5 text-sm font-semibold text-blue-700 hover:underline"
        aria-expanded={expanded}
      >
        {expanded ? "Hide research details ↑" : "Explore research details ↓"}
      </button>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-gray-100 pt-5">
          <section>
            <h3 className="font-semibold text-gray-900">
              Variant information
            </h3>

            <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Panel allele" value={variant.risk_allele} />
              <Detail label="Possible alleles" value={variant.alleles.join(" / ")} />
              <Detail label="Chromosome" value={variant.chromosome} />
              <Detail
                label="GRCh38 position"
                value={formatNumber(variant.position_grch38)}
              />
              <Detail
                label="GRCh37 position"
                value={formatNumber(variant.position_grch37)}
              />
              <Detail
                label="Replication sample size"
                value={formatNumber(variant.max_replication_size)}
              />
            </dl>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              The panel allele is a reference field in the research dataset.
              It does not, by itself, establish whether an allele is
              beneficial, harmful, or associated with a particular outcome.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">
              Statistical evidence
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {variant.best_mlog !== null
                ? `The strongest recorded -log10(p-value) statistic is ${variant.best_mlog.toFixed(2)}.`
                : "No statistical significance value is available in the panel."}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              This statistic describes the strength of statistical evidence
              against a null association in a study. It does not measure
              the size, importance, or practical impact of an effect.
            </p>

            {variant.effect_sizes.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-800">
                  Reported effect-size values
                </p>
                <p className="mt-1 break-words text-sm text-gray-600">
                  {variant.effect_sizes.join(", ")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Values are reproduced from the panel source. Their
                  units and meanings may differ between studies.
                </p>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">
              Research references
            </h3>

            {variant.pubmed_ids.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {variant.pubmed_ids.map((pmid) => (
                  <li key={pmid}>
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      PMID: {pmid} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                No PubMed references provided.
              </p>
            )}

            {variant.study_accessions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-800">
                  GWAS Catalog accessions
                </p>

                <ul className="mt-2 space-y-2">
                  {variant.study_accessions.map((accession) => (
                    <li key={accession}>
                      <a
                        href={`https://www.ebi.ac.uk/gwas/studies/${accession}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-700 hover:underline"
                      >
                        {accession} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {variant.aliases.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900">
                Known rsID aliases
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {variant.aliases.join(", ")}
              </p>
            </section>
          )}

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              How to interpret this evidence
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {variant.replicated_papers > 0
                ? `The panel records ${variant.replicated_papers} replicated paper(s), with a maximum replication sample size of ${formatNumber(variant.max_replication_size)}. Replication provides additional support for an association, but does not establish causation.`
                : "The panel does not record independently replicated papers for this variant. The reported association should therefore be interpreted cautiously."}
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Genetic associations are statistical findings at the
              population level. They do not determine an individual's
              cognitive abilities, personality, or behavior.
            </p>
          </section>
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-gray-800">
        {value}
      </dd>
    </div>
  );
}

export default function SNPExplorer({
  variants,
}: {
  variants: Variant[];
}) {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");

  const filteredVariants = useMemo(() => {
    const query = search.toLowerCase().trim();

    return variants.filter((variant) => {
      const matchesDomain =
        domain === "all" || variant.domain === domain;

      const searchable = variant.domain.toLowerCase();

      return matchesDomain && searchable.includes(query);
    });
  }, [variants, search, domain]);

  const countByDomain = (id: string) =>
    id === "all"
      ? variants.length
      : variants.filter((v) => v.domain === id).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            MyHelix Research Guide
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            The Science Behind the Panel
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
            Explore the scientific literature behind the genetic
            variants included in MyHelix. Learn what researchers
            have studied, how much evidence is available, and
            where the limitations remain.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            {variants.length} research entries · Static research reference
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-gray-900">
            Understanding genetic research
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-700">
            The entries below summarize associations reported in
            scientific studies. An association does not prove that
            a variant causes a trait, and population-level findings
            cannot predict an individual's abilities or behavior.
            The amount of research, replication, and statistical
            evidence varies across entries.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAINS.slice(1).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {countByDomain(item.id)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Research entries
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Explore the research
          </h2>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by domain..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
            >
              {DOMAINS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {domain !== "all" && (
            <p className="mt-3 text-sm text-gray-500">
              {DOMAIN_DESCRIPTIONS[domain]}
            </p>
          )}

          <p className="mb-4 mt-6 text-sm text-gray-500">
            Showing {filteredVariants.length} of {variants.length} entries
          </p>

          <div className="grid gap-5 lg:grid-cols-2">
            {filteredVariants.map((variant) => (
              <VariantCard key={variant.rsid} variant={variant} />
            ))}
          </div>

          {filteredVariants.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <h3 className="font-semibold text-gray-900">
                No matching variants
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try another rsID, gene, trait, or research domain.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="font-semibold text-gray-900">
            Research and educational disclaimer
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            This page is an educational summary of research metadata.
            It is not medical advice, a diagnostic tool, or a
            prediction of individual cognitive performance or
            psychological characteristics. Genetic associations
            may vary across populations and study designs. The
            original publications should be consulted for complete
            methods, effect estimates, and limitations.
          </p>

          <p className="mt-4 text-xs text-gray-400">
            MyHelix · Science Behind the Panel
          </p>
        </div>
      </footer>
    </main>
  );
}
