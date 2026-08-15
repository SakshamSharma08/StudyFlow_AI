import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState, LoadingGrid, PageHeader } from "@/components/common";
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
import { useCreate, useRemove, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — StudyFlow AI" },
      { name: "description", content: "Manage the subjects you are studying this term." },
      { property: "og:title", content: "Subjects — StudyFlow AI" },
      { property: "og:description", content: "Organise your courses in one place." },
    ],
  }),
  component: SubjectsPage,
});

const COLORS = ["#0f766e", "#d97706", "#2563eb", "#db2777", "#16a34a", "#7c3aed"];

function SubjectsPage() {
  const { data = [], isLoading } = useSubjects();
  const create = useCreate("subjects", "Subject");
  const remove = useRemove("subjects", "Subject");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [credits, setCredits] = useState("3");
  const [color, setColor] = useState(COLORS[0]!);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Subject name must be at least 2 characters");
      return;
    }
    setError("");
    create.mutate(
      {
        name: name.trim(),
        teacher: teacher.trim() || null,
        credits: Number(credits) || 0,
        color,
      },
      {
        onSuccess: () => {
          setName("");
          setTeacher("");
          setCredits("3");
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Every course you are tracking this term."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Linear Algebra"
                  />
                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Input
                      id="teacher"
                      value={teacher}
                      onChange={(e) => setTeacher(e.target.value)}
                      placeholder="Dr. Rao"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="0"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Colour</Label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Colour ${c}`}
                        onClick={() => setColor(c)}
                        className={`size-7 rounded-full ring-offset-2 ${color === c ? "ring-2 ring-ring" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    Save subject
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
          icon={BookOpen}
          title="No subjects yet"
          description="Add your courses so assignments, exams and study sessions can be grouped by subject."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((subject) => (
            <div key={subject.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="size-9 rounded-lg"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <p className="font-semibold">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.teacher || "No teacher"} · {subject.credits} credits
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete subject"
                  onClick={() => remove.mutate(subject.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
