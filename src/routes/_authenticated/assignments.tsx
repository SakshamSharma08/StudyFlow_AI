import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignments, useCreate, useRemove, useSubjects, useUpdate } from "@/lib/data";
import type { AssignmentStatus, Priority } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — StudyFlow AI" },
      {
        name: "description",
        content: "Create, prioritise and complete assignments with deadlines and statuses.",
      },
      { property: "og:title", content: "Assignments — StudyFlow AI" },
      { property: "og:description", content: "Never miss a deadline again." },
    ],
  }),
  component: AssignmentsPage,
});

const PRIORITY_TONE: Record<Priority, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

function AssignmentsPage() {
  const { data = [], isLoading } = useAssignments();
  const { data: subjects = [] } = useSubjects();
  const create = useCreate("assignments", "Assignment");
  const update = useUpdate("assignments", "Assignment");
  const remove = useRemove("assignments", "Assignment");

  const [filter, setFilter] = useState<"all" | AssignmentStatus>("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const visible = filter === "all" ? data : data.filter((a) => a.status === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }
    setError("");
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId === "none" ? null : subjectId,
        priority,
        status: "pending",
        due_date: dueDate || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setDueDate("");
          setSubjectId("none");
          setPriority("medium");
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Prioritise your work and track it to done."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Essay on climate policy"
                  />
                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(v) => setPriority(v as Priority)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Due date</Label>
                    <Input
                      id="due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    Save assignment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingGrid />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments here"
          description="Add an assignment with a deadline and priority to start tracking it."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const subject = subjects.find((s) => s.id === a.subject_id);
            return (
              <div
                key={a.id}
                className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    <Badge variant={PRIORITY_TONE[a.priority]}>{a.priority}</Badge>
                    {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.due_date
                      ? `Due ${format(parseISO(a.due_date), "d MMM yyyy")}`
                      : "No deadline"}
                    {a.description ? ` · ${a.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={a.status}
                    onValueChange={(v) => update.mutate({ id: a.id, values: { status: v } })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue>{STATUS_LABEL[a.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete assignment"
                    onClick={() => remove.mutate(a.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
