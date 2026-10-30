"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

type EvidenceTier = "strong" | "moderate" | "limited";

type Props = {
  rsid: string;
  genotype: string | null;
  evidenceTier: EvidenceTier;
  summary: string;
};

const evidenceDescriptions: Record<EvidenceTier, string> = {
  strong:
    "This association has comparatively stronger supporting evidence. It does not mean the variant can reliably predict your individual traits.",
  moderate:
    "Research provides some support for this association, but uncertainties remain about how consistently it applies across populations and studies.",
  limited:
    "The evidence is preliminary or inconsistent. This finding should be interpreted cautiously.",
};

export default function FindingExplanation({
  rsid,
  genotype,
  evidenceTier,
  summary,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          What does this result mean?
        </span>

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-indigo-100 px-4 py-4 text-sm leading-6 text-slate-700">
          <div>
            <h4 className="font-semibold text-slate-900">
              Your genetic result
            </h4>
            <p className="mt-1">{summary}</p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">What is {rsid}?</h4>
            <p className="mt-1">
              {rsid} is a reference identifier for a specific genetic variant.
              Researchers use these identifiers to study associations between
              genetic variation and different traits.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">
              What does your genotype mean?
            </h4>
            <p className="mt-1">
              {genotype
                ? `Your file reports ${genotype} at this location. These letters represent the DNA bases reported for this genetic marker. Their interpretation depends on which allele the study examined.`
                : "Your file does not contain a readable genotype for this marker."}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">
              How reliable is this finding?
            </h4>
            <p className="mt-1">{evidenceDescriptions[evidenceTier]}</p>
          </div>

          <p className="border-t border-indigo-100 pt-3 text-xs text-slate-500">
            Genetic associations describe patterns observed in research
            populations. They cannot determine your individual abilities,
            health, or future outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
