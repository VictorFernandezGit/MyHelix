"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export default function UploadPage() {
  const [status, setStatus] = useState<string>("");
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow selecting the same file again after an error.
    e.target.value = "";

    // The current pipeline supports 23andMe text exports.
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setStatus("Please select a supported 23andMe .txt file.");
      return;
    }

    const supabase = createClient();

    try {
      setStatus("Checking your session...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("Please sign in before uploading.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setStatus("Your session has expired. Please sign in again.");
        return;
      }

      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // 1. Upload raw DNA file to private Supabase Storage.
      setStatus("Uploading your DNA file...");

      const { error: uploadError } = await supabase.storage
        .from("genetic-uploads")
        .upload(filePath, file);

      if (uploadError) {
        setStatus(`Upload failed: ${uploadError.message}`);
        return;
      }

      // 2. Create an upload record in the database.
      setStatus("Saving upload information...");

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
        setStatus(
          `File uploaded, but metadata could not be saved: ${
            dbError?.message ?? "Unknown error"
          }`,
        );
        return;
      }

      // 3. Request processing from FastAPI.
      setStatus("Starting genetic analysis...");

      const processUrl = `${API_URL}/process/${upload.id}`;

      console.log("Processing request:", processUrl);

      let response: Response;

      try {
        response = await fetch(processUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (error) {
        console.error("Unable to reach FastAPI:", error);

        setStatus(
          "Could not connect to the analysis server. Check your API URL, backend availability, and CORS settings.",
        );
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();

        console.error("FastAPI processing error:", {
          status: response.status,
          response: errorText,
        });

        setStatus(
          `Analysis could not start (HTTP ${response.status}). Check the browser console.`,
        );
        return;
      }

      // 4. Poll Supabase for processing completion.
      setStatus("Analyzing your genetic markers...");

      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data, error: pollError } = await supabase
          .from("uploads")
          .select("status")
          .eq("id", upload.id)
          .single();

        if (pollError) {
          console.error("Failed to check upload status:", pollError);
          setStatus("Unable to check analysis status. Please try again later.");
          return;
        }

        if (data?.status === "failed") {
          setStatus(
            "Analysis failed. Verify that your file is a supported 23andMe raw DNA export.",
          );
          return;
        }

        if (data?.status === "complete") {
          setStatus("Analysis complete! Opening your report...");

          router.push(`/report/test?upload=${upload.id}`);
          return;
        }
      }

      setStatus(
        "Your analysis is taking longer than expected. You can check your report later.",
      );
    } catch (error) {
      console.error("Unexpected upload error:", error);

      setStatus(
        "Something went wrong while uploading or processing your file.",
      );
    }
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
          <span className="text-xs text-gray-400">
            Supported: 23andMe raw DNA (.txt)
          </span>

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
