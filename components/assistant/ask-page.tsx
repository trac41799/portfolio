"use client";

import { Conversation } from "./conversation";

const SUGGESTIONS = [
  "What did he build at Edge8 AI?",
  "Compare the LMS and Travel Buddy projects",
  "Show his career timeline",
  "Design a one-page recruiter summary",
] as const;

export function AskPageClient() {
  return (
    <div
      data-testid="ask-page"
      className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-surface/30 p-4"
    >
      <Conversation
        variant="page"
        suggestions={SUGGESTIONS}
        emptyPrompt="Ask anything about Trac — his work at Edge8 AI, his research, projects, or how to get in touch."
      />
    </div>
  );
}
