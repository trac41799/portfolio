import type { Metadata } from "next";
import { AskPageClient } from "@/components/assistant/ask-page";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask an AI assistant anything about Nguyen Dang Trac — his work at Edge8 AI, research, projects, and experience. Answers stream back as rich Markdown, interactive components, and generated views.",
};

export default function AskPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col px-6 pb-8 pt-14 md:pt-16">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
          Ask about me
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-5xl">
          Ask me anything about Trac
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          A chatbot-first way to explore my background. Answers stream back as rich
          Markdown, pre-templated interactive components, and generated views — not just
          plain text.
        </p>
      </header>
      <AskPageClient />
    </section>
  );
}
