"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/report" },
  { label: "Traits", href: "/report/traits" },
  { label: "SNP explorer", href: "/report/snp-explorer" },
  { label: "Settings", href: "/report/settings" },
];

export default function ReportSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the upload ID from the current URL.
  const uploadId = searchParams.get("upload");

  const isActive = (href: string) =>
    href === "/report" ? pathname === href : pathname.startsWith(href);

  // Preserve the selected upload when switching report pages.
  const getHref = (href: string) => {
    if (!uploadId || href === "/report/settings") {
      return href;
    }

    return `${href}?upload=${encodeURIComponent(uploadId)}`;
  };

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
      className="flex h-full flex-col gap-3 rounded-3xl border-2 border-slate-400 bg-white p-4"
    >
      {NAV_ITEMS.map(({ label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={getHref(href)}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border-2 border-slate-800 px-4 py-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2 ${
              active
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-900 hover:bg-slate-300"
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
