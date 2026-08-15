import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Plus, Timer, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState, LoadingGrid, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreate, useRemove, useStudySessions, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Study Sessions — StudyFlow AI" },
      { name: "description", content: "Log study sessions per subject and build a study-hour record." },
      { property: "og:title", content: "Study Sessions — StudyFlow AI" },
      { property: "og:description", content: "Track how long you actually study." },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data = [], isLoading } = useStudySessions();
  const { data: subjects = [] } = useSubjects();
  const create = useCreate("study_sessions", "Session");
  const remove = useRemove("study_sessions", "Session");

  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState("60");
  const [subjectId, setSubjectId] = useState("none");
  const [studiedAt, setStudiedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const totalMinutes = data.reduce((s, x) => s + x.duration_minutes, 0);
  const avg = data.length ? Math.round(totalMinutes / data.length) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const minutes = Number(duration);
    if (!minutes || minutes <= 0) return setError("Duration must be a positive number of minutes");
    setError("");
    create.mutate(
      {
        duration_minutes: minutes,
        subject_id: subjectId === "none" ? null : subjectId,
        studied_at: studiedAt ? new Date(studiedAt).toISOString() : new Date().toISOString(),
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setDuration("60");
          setNotes("");
          setStudiedAt("");
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study sessions"
        description="Every focused block you log builds your analytics."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Log session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log study session</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studied-at">When</Label>
                  <Input
                    id="studied-at"
                    type="datetime-local"
                    value={studiedAt}
                    onChange={(e) => setStudiedAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-notes">Notes</Label>
                  <Textarea
                    id="session-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you cover?"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    Save session
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Timer} label="Total hours" value={(totalMinutes / 60).toFixed(1)} />
        <StatCard icon={Timer} label="Sessions" value={data.length} tone="accent" />
        <StatCard icon={Timer} label="Avg session" value={`${avg} min`} tone="success" />
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="No sessions logged"
          description="Log your first study block to start building your study-hour history."
        />
      ) : (
        <div className="space-y-3">
          {data.map((session) => {
            const subject = subjects.find((s) => s.id === session.subject_id);
            return (
              <div
                key={session.id}
                className="surface-card flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{session.duration_minutes} min</p>
                    {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(parseISO(session.studied_at), "d MMM yyyy, HH:mm")}
                    {session.notes ? ` · ${session.notes}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete session"
                  onClick={() => remove.mutate(session.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
