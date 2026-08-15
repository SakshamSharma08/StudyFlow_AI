import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow AI — Student Productivity Platform" },
      {
        name: "description",
        content:
          "Track assignments, goals, exams and study hours in one dashboard, with an AI study coach that builds plans around your deadlines.",
      },
      { property: "og:title", content: "StudyFlow AI — Student Productivity Platform" },
      {
        property: "og:description",
        content: "One dashboard for assignments, goals, exams, study hours and AI study plans.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Assignments that stay on track",
    body: "Priorities, deadlines and statuses so nothing slips through the term.",
  },
  {
    icon: Target,
    title: "Goals with real progress",
    body: "Set measurable targets and watch the bar fill as you log the work.",
  },
  {
    icon: CalendarDays,
    title: "Exam countdowns",
    body: "Every paper on one schedule, with days-remaining at a glance.",
  },
  {
    icon: BarChart3,
    title: "Study analytics",
    body: "Hours per day, hours per subject, and how your workload is trending.",
  },
  {
    icon: Sparkles,
    title: "AI study assistant",
    body: "Ask study questions or get a plan built around your actual deadlines.",
  },
  {
    icon: GraduationCap,
    title: "Built for students",
    body: "Fast, clean and responsive — works just as well on your phone.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">StudyFlow AI</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="hero-gradient">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> AI-powered student productivity
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Every deadline, goal and study hour in one calm dashboard.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            StudyFlow AI keeps your assignments, exams and subjects organised — then helps
            you plan the work with an AI study coach that knows your schedule.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-2xl font-semibold sm:text-3xl">Everything a busy term needs</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="surface-card p-6">
              <span className="inline-flex rounded-xl bg-secondary p-2.5 text-primary">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} StudyFlow AI</span>
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
