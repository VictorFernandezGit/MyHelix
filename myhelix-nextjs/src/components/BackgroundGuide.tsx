const BASICS = [
  {
    term: "SNP",
    definition:
      "Single Nucleotide Polymorphism (pronounced \u201csnip\u201d). A single spot in your DNA where people commonly differ by one letter (A, C, G, or T). Each letter is a nucleotide, one of DNA\u2019s building blocks.",
  },
  {
    term: "rs ID",
    definition:
      "\u201crs\u201d stands for Reference SNP cluster ID. It\u2019s the standard catalog number for a specific variation, recorded in public archives like dbSNP, so every researcher uses the same name for the same spot.",
  },
];

const GLOSSARY = [
  {
    term: "Genotype",
    definition:
      "The two letters you have at a spot, one inherited from each parent. GG means you have a G from both.",
  },
  {
    term: "GWAS",
    definition:
      "A genome-wide association study. Researchers scan the DNA of thousands of people to find spots where the letters tend to differ between people with and without a trait.",
  },
  {
    term: "Discovery and replication samples",
    definition:
      "The discovery sample is the first group where a link was found. The replication sample is a separate group used to check that the link holds up.",
  },
  {
    term: "p-value",
    definition:
      "How unlikely a result is to be a coincidence. Smaller means stronger statistically, but it doesn\u2019t tell you how big the effect is.",
  },
  {
    term: "Evidence level",
    definition:
      "How much we trust a finding, based on the number and consistency of studies. \u201cLimited\u201d means the evidence is preliminary or inconsistent.",
  },
];

const GOOD_TO_KNOW = [
  {
    title: "Genes are not destiny",
    body: "Traits like memory are shaped by thousands of tiny genetic effects plus sleep, age, education, stress, and health. A single marker explains very little.",
  },
  {
    title: "Association is not causation",
    body: "A study finding a link between a letter and a trait doesn\u2019t prove the letter causes it.",
  },
  {
    title: "\u201cNot detected\u201d is not the same as \u201cnot tested\u201d",
    body: "Consumer DNA tests read only a small fraction of your genome. A marker can be missing from your file entirely, which is different from your file showing you don\u2019t carry the variant.",
  },
  {
    title: "Studies don\u2019t represent everyone",
    body: "Many large genetic studies were done mostly in people of European ancestry, so results may be less reliable for other ancestries.",
  },
];

export default function BackgroundGuide() {
  return (
    <div className="mt-5 rounded-xl border-2 border-slate-200 bg-white p-4">
      <h3 className="text-base font-bold text-slate-900">Background</h3>

      <dl className="mt-2 space-y-2">
        {BASICS.map(({ term, definition }) => (
          <div key={term}>
            <dt className="inline font-semibold text-slate-900">{term}: </dt>
            <dd className="inline text-slate-700">{definition}</dd>
          </div>
        ))}
      </dl>

      <details className="mt-4">
        <summary className="cursor-pointer font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
          Learn the basics of reading your results
        </summary>

        <h4 className="underline underline-offset-2 mt-4 font-semibold text-slate-900 text-2xl">
          Words you&apos;ll see
        </h4>
        <dl className="mt-2 space-y-2">
          {GLOSSARY.map(({ term, definition }) => (
            <div key={term}>
              <dt className="inline font-semibold text-slate-900">{term}: </dt>
              <dd className="inline text-slate-700">{definition}</dd>
            </div>
          ))}
        </dl>

        <h4 className="underline underline-offset-2 mt-4 font-semibold text-slate-900 text-2xl">
          Good to know
        </h4>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
          {GOOD_TO_KNOW.map(({ title, body }) => (
            <li key={title}>
              <span className="font-semibold text-slate-900">{title}.</span>{" "}
              {body}
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          These results are educational, not a diagnosis. If you have concerns
          about your health or memory, talk to a doctor.
        </p>
      </details>
    </div>
  );
}
