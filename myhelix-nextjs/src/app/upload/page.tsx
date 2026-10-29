"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/dist/client/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function UploadPage() {
  const [status, setStatus] = useState<string>("");
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    setStatus("Uploading...");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Please log in first");
      return;
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("genetic-uploads")
      .upload(filePath, file);

    if (uploadError) {
      setStatus(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: upload, error: dbError } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
        status: "pending",
      })
      .select("id")
      .single();

    if (dbError || !upload) {
      setStatus(`Saved file but failed to save metadata: ${dbError?.message}`);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setStatus("Processing...");
    const res = await fetch(`${API_URL}/process/${upload.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (!res.ok) {
      setStatus(`Processing failed to start: ${res.status}`);
      return;
    }

    // check every 2s for up to 2 min, the backend updates the status when its done
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const { data } = await supabase
        .from("uploads")
        .select("status")
        .eq("id", upload.id)
        .single();
      if (data?.status === "failed") {
        setStatus("Processing failed. Check that this is a 23andMe raw data file.");
        return;
      }
      if (data?.status === "complete") {
        setStatus("Report ready. Opening...");
        router.push(`/report/test?upload=${upload.id}`);
        return;
      }
    }
    setStatus("Still processing. Check back in a minute.");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          MyHelix
        </Link>
        <LogoutButton />
      </header>

      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-4 p-6">
        <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50">
          <span className="text-lg font-bold text-gray-600">
            Click to upload your genetic data file
          </span>

          <span className="text-xs text-gray-400">.txt, .csv, or .zip</span>

          <input
            type="file"
            accept=".txt,.csv,.zip"
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        {status && <p className="text-sm text-gray-600">{status}</p>}
      </main>
    </div>
  );
}
