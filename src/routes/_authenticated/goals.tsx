import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Minus, Plus, Target, Trash2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCreate, useGoals, useRemove, useUpdate } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals — StudyFlow AI" },
      { name: "description", content: "Set study goals and track progress towards each target." },
      { property: "og:title", content: "Goals — StudyFlow AI" },
      { property: "og:description", content: "Turn intentions into measurable progress." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data = [], isLoading } = useGoals();
  const create = useCreate("goals", "Goal");
  const update = useUpdate("goals", "Goal");
  const remove = useRemove("goals", "Goal");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("10");
  const [unit, setUnit] = useState("hours");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");
    if (!Number(target) || Number(target) <= 0) return setError("Target must be a positive number");
    setError("");
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        target_value: Number(target),
        current_value: 0,
        unit: unit.trim() || "units",
        deadline: deadline || null,
        status: "active",
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setTarget("10");
          setDeadline("");
          setOpen(false);
        },
      },
    );
  }

  function step(id: string, current: number, targetValue: number, delta: number) {
    const next = Math.max(0, Math.min(targetValue, current + delta));
    update.mutate({
      id,
      values: { current_value: next, status: next >= targetValue ? "completed" : "active" },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Measurable targets for the term."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Title</Label>
                  <Input
                    id="goal-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Study 20 hours of calculus"
                  />
                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-desc">Description</Label>
                  <Textarea
                    id="goal-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target</Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline">Deadline</Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    Save goal
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
          icon={Target}
          title="No goals yet"
          description="Set a target — like weekly study hours — and log your progress as you go."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((goal) => {
            const current = Number(goal.current_value);
            const targetValue = Number(goal.target_value);
            const pct = Math.min(100, Math.round((current / (targetValue || 1)) * 100));
            return (
              <div key={goal.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.deadline
                        ? `Due ${format(parseISO(goal.deadline), "d MMM yyyy")}`
                        : "No deadline"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                      {goal.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete goal"
                      onClick={() => remove.mutate(goal.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {goal.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
                ) : null}
                <Progress value={pct} className="mt-4" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {current} / {targetValue} {goal.unit}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Decrease progress"
                      onClick={() => step(goal.id, current, targetValue, -1)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Increase progress"
                      onClick={() => step(goal.id, current, targetValue, 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
