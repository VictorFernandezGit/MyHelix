// Account preferences, data retention information, and controls for deleting uploaded DNA files and reports.
// Deletion must remove the appropriate storage objects and related database records, not just hide them from the interface.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  FolderOpen,
  RefreshCw,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  AlertCircle,
  LoaderCircle,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type UploadStatus = "pending" | "processing" | "complete" | "failed";

type DNAUpload = {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  status: UploadStatus;
  uploaded_at: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock3,
    style: "bg-amber-50 text-amber-700",
  },
  processing: {
    label: "Processing",
    icon: LoaderCircle,
    style: "bg-blue-50 text-blue-700",
  },
  complete: {
    label: "Complete",
    icon: CheckCircle2,
    style: "bg-emerald-50 text-emerald-700",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    style: "bg-red-50 text-red-700",
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: UploadStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-md font-medium ${config.style}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

export default function SettingsPage() {
  const [uploads, setUploads] = useState<DNAUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUploads = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in to view your DNA files.");
      }

      const { data, error: dbError } = await supabase
        .from("uploads")
        .select("id, user_id, file_name, storage_path, status, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (dbError) {
        throw dbError;
      }

      setUploads((data ?? []) as DNAUpload[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your uploaded files.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  const completedCount = uploads.filter(
    (upload) => upload.status === "complete",
  ).length;

  const processingCount = uploads.filter(
    (upload) => upload.status === "processing" || upload.status === "pending",
  ).length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Page Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            MyHelix / Settings
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            My DNA files
          </h1>

          <p className="mt-2 max-w-2xl text-lg leading-7 text-slate-600">
            View your uploaded genetic data, monitor analysis progress, and
            access completed reports.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Upload size={16} />
          Upload DNA file
        </Link>
      </header>

      {/* Summary */}
      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total uploads", value: uploads.length },
            { label: "Completed reports", value: completedCount },
            { label: "Pending / processing", value: processingCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border-2 border-slate-400 bg-white p-5"
            >
              <p className="text-md text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Files */}
      <section className="overflow-hidden rounded-2xl border-2 border-slate-400 bg-white">
        <div className="flex items-center justify-between border-b border-slate-400 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={19} className="text-slate-600" />
            <h2 className="text-md font-semibold text-slate-900">
              Uploaded files
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void loadUploads(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-md font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading your DNA files...
          </div>
        ) : error ? (
          <div className="p-8">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadUploads()}
              className="mt-3 text-sm font-medium text-blue-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-slate-100 p-4">
              <FileText size={28} className="text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No DNA files uploaded yet
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Upload a supported 23andMe raw DNA file to begin exploring your
              genetic research findings.
            </p>

            <Link
              href="/upload"
              className="mt-5 text-sm font-medium text-blue-700 hover:underline"
            >
              Upload your first file
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-400">
            {uploads.map((upload) => (
              <li
                key={upload.id}
                className="flex flex-wrap items-center gap-4 px-5 py-5"
              >
                <div className="rounded-xl bg-slate-100 p-3">
                  <FileText size={21} className="text-slate-700" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-lg font-semibold text-slate-900"
                    title={upload.file_name}
                  >
                    {upload.file_name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Uploaded {formatDate(upload.uploaded_at)}
                  </p>
                </div>

                <StatusBadge status={upload.status} />

                {upload.status === "complete" ? (
                  <Link
                    href={`/report?upload=${encodeURIComponent(upload.id)}`}
                    className="inline-flex items-center gap-1.5 text-md font-medium text-blue-700 hover:underline"
                  >
                    View report
                    <ExternalLink size={14} />
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">
                    {upload.status === "failed"
                      ? "Analysis unavailable"
                      : "Awaiting results"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Privacy information */}
      <section className="flex gap-4 rounded-2xl border-2 border-slate-400 bg-slate-50 p-5">
        <ShieldCheck size={22} className="shrink-0 text-slate-700" />

        <div>
          <h2 className="font-semibold text-slate-900">
            Your genetic data & privacy
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-900">
            MyHelix uses Supabase to store uploaded DNA files and their
            associated analysis results. Access to your files and reports should
            be restricted to your authenticated account.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-900">
            File download and permanent deletion controls are not yet
            implemented on this page.
          </p>
        </div>
      </section>
    </main>
  );
}
