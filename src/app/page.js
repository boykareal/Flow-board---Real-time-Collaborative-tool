import Link from "next/link";
import { ArrowRight, Check, Columns3, UsersRound } from "lucide-react";

const features = [
  {
    icon: Columns3,
    title: "Keep work moving",
    description: "Organize tasks into clear columns and see progress at a glance.",
  },
  {
    icon: UsersRound,
    title: "Work as a team",
    description: "Invite people to your boards and choose the right role for each member.",
  },
  {
    icon: Check,
    title: "Stay in sync",
    description: "Changes appear in real time, so everyone sees the latest plan.",
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[30rem] max-w-5xl bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_65%)]" />
      <div className="mx-auto max-w-6xl">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-200 sm:text-sm">
            <span className="size-1.5 rounded-full bg-indigo-300" />
            A calmer way to collaborate
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Make teamwork feel <span className="text-indigo-300">clear.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
            Bring tasks, people, and progress together in one simple workspace.
            FlowBoard helps your team focus on what comes next.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/70 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Log in
            </Link>
          </div>
        </section>

        <section aria-label="FlowBoard features" className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10 sm:p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-zinc-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
