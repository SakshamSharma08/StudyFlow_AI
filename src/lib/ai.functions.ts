import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  context: z.string().max(2000).optional(),
});

const SYSTEM_PROMPT =
  "You are StudyFlow AI, a friendly study coach for students. Answer study questions clearly and build practical, realistic study plans. Use short paragraphs and bullet lists. Keep responses under 250 words unless the student asks for a full plan.";

function mockReply(question: string, context?: string): string {
  const q = question.toLowerCase();
  if (q.includes("plan") || q.includes("schedule") || q.includes("timetable")) {
    return [
      "Here is a simple weekly study plan you can adapt:",
      "",
      "- **Mon/Wed/Fri:** two 50-minute focus blocks on your hardest subject, 10-minute breaks between.",
      "- **Tue/Thu:** one block for assignments due soonest, one block of active recall (flashcards, past papers).",
      "- **Sat:** 90 minutes reviewing everything you covered during the week.",
      "- **Sun:** rest, then 30 minutes planning the week ahead.",
      "",
      context ? `Based on your data: ${context}` : "",
      "",
      "_Demo response — connect an AI key for fully personalised plans._",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (q.includes("focus") || q.includes("procrastinat") || q.includes("motivat")) {
    return "Try the 25/5 Pomodoro cycle: 25 minutes of single-task work, 5 minutes away from the screen. Put your phone in another room, write the one sentence goal for the block on paper, and stop exactly at the timer.\n\n_Demo response — connect an AI key for fully personalised coaching._";
  }
  return `Good question. Break "${question.slice(0, 80)}" into three steps: (1) skim the material for the main idea, (2) write your own summary without looking, (3) test yourself and fix the gaps. Repeat step 3 after a day and after a week for long-term recall.\n\n_Demo response — connect an AI key for fully personalised answers._`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const last = data.messages[data.messages.length - 1]!;
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: mockReply(last.content, data.context), mock: true };
    }

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.5-flash",
          messages: [
            {
              role: "system",
              content: data.context
                ? `${SYSTEM_PROMPT}\n\nStudent context: ${data.context}`
                : SYSTEM_PROMPT,
            },
            ...data.messages,
          ],
        }),
      });

      if (!response.ok) {
        return { reply: mockReply(last.content, data.context), mock: true };
      }

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = json.choices?.[0]?.message?.content;
      if (!reply) return { reply: mockReply(last.content, data.context), mock: true };
      return { reply, mock: false };
    } catch {
      return { reply: mockReply(last.content, data.context), mock: true };
    }
  });
