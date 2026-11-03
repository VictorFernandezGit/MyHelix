import { Suspense } from "react";
import ReportDashboard from "@/components/report/ReportDashboard";

export default function ReportPage() {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-slate-500">Loading report...</p>}
    >
      <ReportDashboard />
    </Suspense>
  );
}
