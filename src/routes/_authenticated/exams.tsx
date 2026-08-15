import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState, LoadingGrid, PageHeader } from "@/components/common";
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
import { useCreate, useExams, useRemove, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exams — StudyFlow AI" },
      { name: "description", content: "Your exam schedule with live countdowns to each paper." },
      { property: "og:title", content: "Exams — StudyFlow AI" },
      { property: "og:description", content: "See exactly how long you have until each exam." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { data = [], isLoading } = useExams();
  const { data: subjects = [] } = useSubjects();
  const create = useCreate("exams", "Exam");
  const remove = useRemove("exams", "Exam");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");
    if (!examDate) return setError("Pick a date and time for the exam");
    setError("");
    create.mutate(
      {
        title: title.trim(),
        exam_date: new Date(examDate).toISOString(),
        subject_id: subjectId === "none" ? null : subjectId,
        location: location.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setExamDate("");
          setLocation("");
          setNotes("");
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam schedule"
        description="Countdowns so nothing sneaks up on you."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-title">Title</Label>
                  <Input
                    id="exam-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Midterm — Statistics"
                  />
                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="exam-date">Date &amp; time</Label>
                    <Input
                      id="exam-date"
                      type="datetime-local"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Hall B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-notes">Notes</Label>
                  <Textarea
                    id="exam-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    Save exam
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <LoadingGrid />
      ) : data.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No exams scheduled"
          description="Add your exam dates to get a live countdown for each one."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((exam) => {
            const date = parseISO(exam.exam_date);
            const days = differenceInCalendarDays(date, new Date());
            const subject = subjects.find((s) => s.id === exam.subject_id);
            return (
              <div key={exam.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(date, "d MMM yyyy, HH:mm")}
                      {exam.location ? ` · ${exam.location}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete exam"
                    onClick={() => remove.mutate(exam.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {subject ? <Badge variant="outline">{subject.name}</Badge> : <span />}
                  <Badge variant={days < 0 ? "secondary" : days <= 3 ? "destructive" : "default"}>
                    {days < 0 ? "Completed" : days === 0 ? "Today" : `${days} days left`}
                  </Badge>
                </div>
                {exam.notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">{exam.notes}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
