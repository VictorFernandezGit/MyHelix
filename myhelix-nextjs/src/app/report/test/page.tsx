// test report page just for checking the pipeline output while the real report page gets built
import { Suspense } from "react";
import TestReport from "./TestReport";

export default function TestReportPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading report...</p>}>
      <TestReport />
    </Suspense>
  );
}
