import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/ai.functions";
import { useAssignments, useExams, useStudySessions, useSubjects } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Study Assistant — StudyFlow AI" },
      {
        name: "description",
        content: "Ask study questions and get personalised study plans from your AI study coach.",
      },
      { property: "og:title", content: "AI Study Assistant — StudyFlow AI" },
      { property: "og:description", content: "Your always-on study coach." },
    ],
  }),
  component: AssistantPage,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Build me a weekly study plan",
  "How do I revise for a maths exam?",
  "Help me stop procrastinating",
  "Explain active recall simply",
];

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const assignments = useAssignments();
  const subjects = useSubjects();
  const exams = useExams();
  const sessions = useStudySessions();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your StudyFlow study coach. Ask me anything about studying, or ask for a personalised study plan based on your subjects and deadlines.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function buildContext() {
    const open = (assignments.data ?? []).filter((a) => a.status !== "completed");
    const hours =
      (sessions.data ?? []).reduce((s, x) => s + x.duration_minutes, 0) / 60;
    return [
      `Subjects: ${(subjects.data ?? []).map((s) => s.name).join(", ") || "none yet"}`,
      `Open assignments: ${open.map((a) => `${a.title} (${a.priority}, due ${a.due_date ?? "no date"})`).join("; ") || "none"}`,
      `Upcoming exams: ${(exams.data ?? []).map((e) => `${e.title} on ${e.exam_date.slice(0, 10)}`).join("; ") || "none"}`,
      `Study hours logged: ${hours.toFixed(1)}`,
    ].join(". ");
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const result = await ask({
        data: {
          messages: next.filter((m) => m.role !== "assistant" || m !== next[0]).slice(-12),
          context: buildContext().slice(0, 1900),
        },
      });
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch {
      toast.error("The assistant is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Study Assistant"
        description="Ask study questions or request a plan built around your deadlines."
      />

      <div className="surface-card flex h-[65vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" ? (
                <span className="mt-1 h-fit rounded-lg bg-primary/10 p-1.5 text-primary">
                  <Sparkles className="size-4" />
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revision, planning, focus…"
              aria-label="Message"
            />
            <Button type="submit" disabled={loading || input.trim().length === 0}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
