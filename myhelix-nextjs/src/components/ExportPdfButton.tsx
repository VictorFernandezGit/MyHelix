"use client";

export default function ExportPdfButton() {
  const handleExport = () => window.print();

  return (
    <button
      type="button"
      onClick={handleExport}
      className="shrink-0 rounded-xl border-2 border-slate-800 bg-sky-200 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2 print:hidden"
    >
      Export PDF
    </button>
  );
}
