"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/report" },
  { label: "Traits", href: "/report/traits" },
  { label: "Condition panels", href: "/report/conditions" },
  { label: "SNP explorer", href: "/report/snp-explorer" },
  { label: "Reports", href: "/report/reports" },
  { label: "Settings", href: "/report/settings" },
];

export default function ReportSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/report" ? pathname === href : pathname.startsWith(href);

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete all of your uploaded data and results? This can't be undone.",
    );
    if (!confirmed) return;

    // TODO: call your FastAPI/Supabase delete endpoint here,
    // then sign the user out or redirect to /upload.
  };

  return (
    <nav
      aria-label="Report sections"
      className="flex h-full flex-col gap-3 rounded-3xl border border-slate-300 bg-white p-4"
    >
      {NAV_ITEMS.map(({ label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border-2 border-slate-800 px-4 py-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2 ${
              active
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-900 hover:bg-slate-100"
            }`}
          >
            {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleDelete}
        className="mt-2 rounded-xl border-2 border-red-400 bg-red-200 px-4 py-3 text-center text-sm font-semibold text-red-900 transition-colors hover:bg-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        Delete my data
      </button>
    </nav>
  );
}
