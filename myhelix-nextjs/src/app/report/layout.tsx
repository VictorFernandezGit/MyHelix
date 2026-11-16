import ReportSidebar from "@/components/ReportSidebar";
import { Suspense } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { Dna } from "lucide-react";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* TOP NAVBAR */}
      <nav className="w-full border-b border-slate-200 bg-[#f7f5ff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Dna className="h-7 w-7 text-indigo-600" />
            <span className="text-2xl font-bold tracking-tight">MyHelix</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link
              href="/#how-it-works"
              className="transition hover:text-slate-950"
            >
              How it works
            </Link>

            <Link
              href="/#what-we-analyze"
              className="transition hover:text-slate-950"
            >
              What we analyze
            </Link>

            <Link href="/#privacy" className="transition hover:text-slate-950">
              Privacy
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="text-indigo-700 hover:text-white bg-indigo-200 hover:bg-indigo-500 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Upload
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-col gap-6 p-4 md:flex-row md:items-start md:p-6">
        {/* LEFT SIDEBAR */}
        <aside className="w-full shrink-0 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-60">
          <Suspense fallback={null}>
            <ReportSidebar />
          </Suspense>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
