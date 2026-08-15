import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, format, isSameDay, parseISO, subDays } from "date-fns";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState, LoadingGrid, PageHeader } from "@/components/common";
import { useAssignments, useStudySessions, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — StudyFlow AI" },
      { name: "description", content: "Charts of your study hours, subject split and assignment status." },
      { property: "og:title", content: "Analytics — StudyFlow AI" },
      { property: "og:description", content: "Understand your study patterns with clear charts." },
    ],
  }),
  component: AnalyticsPage,
});

const STATUS_COLORS = ["var(--color-chart-2)", "var(--color-chart-4)", "var(--color-chart-3)"];

function AnalyticsPage() {
  const sessions = useStudySessions();
  const assignments = useAssignments();
  const subjects = useSubjects();

  if (sessions.isLoading || assignments.isLoading || subjects.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Crunching your numbers…" />
        <LoadingGrid rows={3} />
      </div>
    );
  }

  const sessionRows = sessions.data ?? [];
  const assignmentRows = assignments.data ?? [];
  const subjectRows = subjects.data ?? [];

  const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const daily = days.map((day) => ({
    day: format(day, "d MMM"),
    hours:
      Math.round(
        (sessionRows
          .filter((s) => isSameDay(parseISO(s.studied_at), day))
          .reduce((sum, s) => sum + s.duration_minutes, 0) /
          60) *
          10,
      ) / 10,
  }));

  const bySubject = subjectRows
    .map((subject) => ({
      name: subject.name,
      hours:
        Math.round(
          (sessionRows
            .filter((s) => s.subject_id === subject.id)
            .reduce((sum, s) => sum + s.duration_minutes, 0) /
            60) *
            10,
        ) / 10,
      color: subject.color,
    }))
    .filter((s) => s.hours > 0);

  const statusData = (["pending", "in_progress", "completed"] as const)
    .map((status, i) => ({
      name: status === "in_progress" ? "In progress" : status[0]!.toUpperCase() + status.slice(1),
      value: assignmentRows.filter((a) => a.status === status).length,
      color: STATUS_COLORS[i]!,
    }))
    .filter((s) => s.value > 0);

  const hasData = sessionRows.length > 0 || assignmentRows.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="How your study time and workload break down." />

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to chart yet"
          description="Log a study session or add an assignment and your analytics will appear here."
        />
      ) : (
        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="text-lg font-semibold">Study hours — last 14 days</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-card p-5">
              <h2 className="text-lg font-semibold">Hours by subject</h2>
              {bySubject.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  Log sessions against a subject to see this chart.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bySubject}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                        {bySubject.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="surface-card p-5">
              <h2 className="text-lg font-semibold">Assignment status</h2>
              {statusData.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">No assignments yet.</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
