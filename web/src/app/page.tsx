import Link from "next/link";

const STATS = [
  { value: "150", label: "fact-checked stories" },
  { value: "436", label: "claims in the corpus" },
  { value: "45", label: "thematic pillars" },
  { value: "100%", label: "of claims with sources" },
];

const STEPS = [
  {
    title: "Ask in plain language",
    body: "No jargon, no search syntax. Ask about people, places, and events the way you would ask a historian.",
  },
  {
    title: "Grounded in the knowledge base",
    body: "Every answer comes only from the 150-story archive. If the archive does not cover your question, the assistant says so and stops.",
  },
  {
    title: "Every claim cited",
    body: "Answers name the story each fact comes from and link the real sources. When sources disagree, you see both accounts side by side.",
  },
];

const SAMPLES = [
  "Who was Biddy Mason?",
  "What is the story of Allensworth, California?",
  "Tell me about Black firefighters in Los Angeles.",
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        {/* Hero */}
        <section className="flex flex-col items-start py-20 sm:py-28">
          <p className="text-sm font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
            California Black Stories
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
            Ask the archive.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            150 fact-checked stories of Black history in California, with
            per-claim sources. Ask a question and get an answer drawn only
            from the archive, never from guesswork.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ask"
              className="rounded-full bg-zinc-900 px-6 py-3 text-[15px] font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Ask a question
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-zinc-300 px-6 py-3 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              How it works
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-4 dark:bg-zinc-800 dark:ring-zinc-800">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 bg-white px-4 py-6 dark:bg-zinc-950"
            >
              <span className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {s.value}
              </span>
              <span className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                {s.label}
              </span>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            How it works
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
              >
                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-1 leading-7 text-zinc-600 dark:text-zinc-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample questions */}
        <section className="pb-16 sm:pb-20">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Try one
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {SAMPLES.map((q) => (
              <Link
                key={q}
                href={`/ask?q=${encodeURIComponent(q)}`}
                className="rounded-2xl bg-white px-6 py-4 text-[15px] font-medium text-zinc-800 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900"
              >
                {q} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            California Black Stories: Black history in California, researched
            and cited.
          </p>
        </footer>
      </main>
    </div>
  );
}
