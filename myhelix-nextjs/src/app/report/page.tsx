import Link from "next/link";
import ExportPdfButton from "@/components/ExportPdfButton";

// TODO: replace all sample data below with results fetched from Supabase.

type Stat = { label: string; value: string };

type Trait = {
  name: string;
  result: string;
  gene: string;
  rsid: string;
  genotype: string;
};

type ConditionPanel = {
  name: string;
  markersFound: number;
  markersTotal: number;
  position: number; // 0 = far left (Lower), 50 = Typical, 100 = far right (Higher)
  label: "Lower" | "Typical" | "Higher";
  tone: "sky" | "violet";
};

const STATS: Stat[] = [
  { label: "SNPs in file", value: "638,129" },
  { label: "Call rate", value: "99.1%" },
  { label: "Panel SNPs matched", value: "184" },
  { label: "Panels run", value: "4" },
];

// Gene / rsID pairs are placeholders from the mockup.
// Verify each pair against ClinVar / GWAS Catalog before showing real results.
const TRAITS: Trait[] = [
  {
    name: "Memory",
    result: "[Result]",
    gene: "MCM6",
    rsid: "rs4988235",
    genotype: "[GT]",
  },
  {
    name: "Cognition",
    result: "[Result]",
    gene: "HERC2",
    rsid: "rs12913832",
    genotype: "[GT]",
  },
  {
    name: "Stress resilience",
    result: "[Result]",
    gene: "CYP1A2",
    rsid: "rs762551",
    genotype: "[GT]",
  },
  {
    name: "Muscle fiber type",
    result: "[Result]",
    gene: "ACTN3",
    rsid: "rs1815739",
    genotype: "[GT]",
  },
  {
    name: "Cognitive enhancements",
    result: "[Result]",
    gene: "TAS2R38",
    rsid: "rs713598",
    genotype: "[GT]",
  },
  {
    name: "Focus",
    result: "[Result]",
    gene: "ABCC11",
    rsid: "rs17822931",
    genotype: "[GT]",
  },
];

const PANELS: ConditionPanel[] = [
  {
    name: "ADHD",
    markersFound: 6,
    markersTotal: 8,
    position: 55,
    label: "Typical",
    tone: "sky",
  },
  {
    name: "Super memory",
    markersFound: 4,
    markersTotal: 6,
    position: 40,
    label: "Typical",
    tone: "violet",
  },
  {
    name: "Depression",
    markersFound: 5,
    markersTotal: 9,
    position: 50,
    label: "Typical",
    tone: "violet",
  },
  {
    name: "Anxiety",
    markersFound: 7,
    markersTotal: 10,
    position: 35,
    label: "Typical",
    tone: "sky",
  },
];

const TONE_CLASSES: Record<ConditionPanel["tone"], string> = {
  sky: "bg-sky-50",
  violet: "bg-violet-50",
};

export default function ReportPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-900">
          Your genetic overview
        </h1>
        <ExportPdfButton />
      </header>

      <section aria-label="File summary">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border-2 border-slate-800 bg-white px-5 py-4"
            >
              <dt className="text-sm text-slate-600">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-semibold text-slate-900">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="traits-heading">
        <h2
          id="traits-heading"
          className="mb-3 text-xl font-semibold text-slate-900"
        >
          Enhancer traits
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TRAITS.map((trait) => (
            <li
              key={trait.name}
              className="rounded-2xl border-2 border-slate-800 bg-white px-5 py-4"
            >
              <p className="text-sm text-slate-600">{trait.name}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {trait.result}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {trait.gene} · {trait.rsid} · {trait.genotype}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="panels-heading">
        <h2
          id="panels-heading"
          className="mb-3 text-xl font-semibold text-slate-900"
        >
          Condition panels
        </h2>
        <ul className="flex flex-col gap-3">
          {PANELS.map((panel) => (
            <li
              key={panel.name}
              className={`grid items-center gap-4 rounded-2xl border-2 border-slate-800 px-5 py-4 md:grid-cols-[12rem_1fr_6rem_6rem] ${TONE_CLASSES[panel.tone]}`}
            >
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {panel.name}
                </p>
                <p className="text-sm text-slate-600">
                  {panel.markersFound} of {panel.markersTotal} markers found
                </p>
              </div>

              <div
                role="img"
                aria-label={`${panel.name}: ${panel.label} (scale from lower to higher)`}
              >
                <div className="relative h-2 rounded-full bg-slate-300">
                  <span
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800"
                    style={{ left: `${panel.position}%` }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 text-xs text-slate-500">
                  <span>Lower</span>
                  <span className="text-center">Typical</span>
                  <span className="text-right">Higher</span>
                </div>
              </div>

              <p className="font-medium text-slate-900">{panel.label}</p>

              <Link
                href="/report/conditions"
                className="font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                View panel
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p
        role="note"
        className="rounded-2xl border-2 border-dashed border-amber-700 bg-amber-50 px-5 py-4 text-center text-sm font-semibold text-amber-900"
      >
        ⚠ Please remember that this is not a diagnosis and is only for
        self-experimentation.
      </p>
    </div>
  );
}
