import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Dna,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-[#f7f5ff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Dna className="h-7 w-7 text-indigo-600" />
            <span className="text-2xl font-bold tracking-tight">MyHelix</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-slate-950">
              How it works
            </a>

            <a
              href="#what-we-analyze"
              className="transition hover:text-slate-950"
            >
              What we analyze
            </a>

            <a href="#privacy" className="transition hover:text-slate-950">
              Privacy
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-10 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Explore what your DNA can tell you
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
              Your DNA is data.
              <span className="block text-indigo-600">Make sense of it.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              MyHelix helps you explore your raw genetic data by analyzing
              selected genetic markers and organizing the results into clear,
              educational insights.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Analyze Your DNA
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Learn How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Privacy focused
              </span>

              <span className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-indigo-600" />
                Simple raw DNA upload
              </span>
            </div>
          </div>

          {/* Hero graphic */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-blue-50 to-white p-8 shadow-xl shadow-indigo-100/50">
              <div className="flex min-h-[390px] flex-col items-center justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-white shadow-lg">
                  <div className="absolute inset-4 rounded-full border border-dashed border-indigo-200" />
                  <Dna
                    strokeWidth={1.5}
                    className="h-24 w-24 text-indigo-600"
                  />
                </div>

                <h2 className="mt-8 text-xl font-semibold">
                  Discover your genetic data
                </h2>

                <p className="mt-2 max-w-sm text-center text-sm leading-6 text-slate-500">
                  Upload your raw DNA file and explore selected genetic markers
                  through evidence-based educational panels.
                </p>

                <div className="mt-7 flex gap-2">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                    23andMe
                  </span>

                  <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                    AncestryDNA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              How it works
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From raw DNA to understandable insights
            </h2>

            <p className="mt-4 text-slate-600">
              MyHelix simplifies the process into three steps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              icon={<FileSearch className="h-6 w-6" />}
              title="Upload your DNA"
              description="Choose your supported raw genetic data file from a provider such as 23andMe or AncestryDNA."
            />

            <StepCard
              number="02"
              icon={<Dna className="h-6 w-6" />}
              title="Analyze your markers"
              description="MyHelix matches genetic variants in your file against selected educational analysis panels."
            />

            <StepCard
              number="03"
              icon={<Brain className="h-6 w-6" />}
              title="Explore your results"
              description="Review organized findings designed to make complex genetic information easier to understand."
            />
          </div>
        </div>
      </section>

      {/* What we analyze */}
      <section id="what-we-analyze">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
                Explore your data
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Choose what you want to explore.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-600">
                Instead of overwhelming you with raw SNP data, MyHelix organizes
                selected genetic findings into focused panels so you can explore
                areas that interest you.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InsightCard
                title="Cognition"
                description="Explore selected markers related to cognitive traits."
              />

              <InsightCard
                title="Nutrition"
                description="Explore genetic markers related to nutrition and metabolism."
              />

              <InsightCard
                title="Sleep"
                description="Explore selected markers associated with sleep and chronotype."
              />

              <InsightCard
                title="More Panels"
                description="Additional educational panels can be added as MyHelix grows."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="bg-[#f7f5ff]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <LockKeyhole className="h-7 w-7 text-indigo-600" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight">
              Genetic data deserves careful handling.
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              MyHelix is designed with privacy in mind. We want users to
              understand how their genetic information is handled and remain in
              control of their data.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              MyHelix provides educational information and is not a medical
              diagnosis or substitute for professional medical advice.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[2rem] bg-slate-950 px-8 py-14 text-center text-white sm:px-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to explore your DNA?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Create an account, upload your supported raw DNA file, and begin
              exploring your genetic data.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Dna className="h-4 w-4 text-indigo-600" />
            MyHelix
          </div>

          <p>Educational genetic insights, made easier to understand.</p>
        </div>
      </footer>
    </main>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <span className="text-sm font-bold text-slate-300">{number}</span>
      </div>

      <h3 className="mt-6 text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 h-2 w-10 rounded-full bg-indigo-500" />

      <h3 className="font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
