import ReportSidebar from "@/components/ReportSidebar";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-white p-4 md:flex-row md:p-6">
      <aside className="md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-60 md:shrink-0">
        <ReportSidebar />
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
