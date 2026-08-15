import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, format, isAfter, parseISO } from "date-fns";
import { CalendarClock, CheckCircle2, ClipboardList, Timer } from "lucide-react";

import { EmptyState, LoadingGrid, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useAssignments,
  useExams,
  useGoals,
  useStudySessions,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudyFlow AI" },
      {
        name: "description",
        content: "Your productivity overview: assignments, study hours, goals and deadlines.",
      },
      { property: "og:title", content: "Dashboard — StudyFlow AI" },
      { property: "og:description", content: "Track your student productivity at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const assignments = useAssignments();
  const sessions = useStudySessions();
  const exams = useExams();
  const goals = useGoals();

  const loading =
    assignments.isLoading || sessions.isLoading || exams.isLoading || goals.isLoading;

  const all = assignments.data ?? [];
  const completed = all.filter((a) => a.status === "completed").length;
  const pending = all.filter((a) => a.status !== "completed").length;
  const totalMinutes = (sessions.data ?? []).reduce((s, x) => s + x.duration_minutes, 0);
  const completionRate = all.length ? Math.round((completed / all.length) * 100) : 0;

  const upcoming = [
    ...all
      .filter((a) => a.due_date && a.status !== "completed")
      .map((a) => ({
        id: a.id,
        title: a.title,
        date: parseISO(a.due_date as string),
        kind: "Assignment" as const,
      })),
    ...(exams.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      date: parseISO(e.exam_date),
      kind: "Exam" as const,
    })),
  ]
    .filter((x) => isAfter(x.date, new Date(Date.now() - 86_400_000)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your study data…" />
        <LoadingGrid rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A snapshot of your progress this term."
        action={
          <Button asChild>
            <Link to="/assignments">Add assignment</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Open assignments"
          value={pending}
          hint={`${all.length} total`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion rate"
          value={`${completionRate}%`}
          hint={`${completed} completed`}
          tone="success"
        />
        <StatCard
          icon={Timer}
          label="Study hours"
          value={(totalMinutes / 60).toFixed(1)}
          hint={`${sessions.data?.length ?? 0} sessions logged`}
          tone="accent"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming exams"
          value={(exams.data ?? []).filter((e) => isAfter(parseISO(e.exam_date), new Date())).length}
          hint="Scheduled ahead"
          tone="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Nothing due soon. Add an assignment or exam to see it here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((item) => {
                const days = differenceInCalendarDays(item.date, new Date());
                return (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.kind} · {format(item.date, "d MMM yyyy")}
                      </p>
                    </div>
                    <Badge variant={days <= 2 ? "destructive" : "secondary"}>
                      {days <= 0 ? "Today" : `${days}d left`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg font-semibold">Goal progress</h2>
          {(goals.data ?? []).length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No goals yet — set one to keep yourself accountable.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {(goals.data ?? []).slice(0, 4).map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((Number(goal.current_value) / Number(goal.target_value || 1)) * 100),
                );
                return (
                  <li key={goal.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Start with your first subject"
          description="Add subjects, then assignments and exams so StudyFlow can track your progress."
          action={
            <Button asChild variant="outline">
              <Link to="/subjects">Add a subject</Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
