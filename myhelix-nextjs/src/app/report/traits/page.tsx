// Organize findings by Memory, Focus, Stress, and Processing Speed.
// Explain what each genetic association means, how strong the evidence is, and what it does not tell us about the individual

import { Suspense } from "react";
import TraitsDashboard from "@/components/TraitsDashboard";

export default function TraitsPage() {
  return (
    <Suspense
      fallback={<p className="p-6 text-lg text-slate-500">Loading traits...</p>}
    >
      <TraitsDashboard />
    </Suspense>
  );
}
