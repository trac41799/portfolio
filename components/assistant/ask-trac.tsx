"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Conversation } from "./conversation";

const SUGGESTIONS = [
  "What did he build at Edge8 AI?",
  "Compare the LMS and Travel Buddy projects",
  "Show his career timeline",
  "Design a one-page recruiter summary",
] as const;

export function AskTrac() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The dedicated /ask page is the full-screen version of this widget.
  if (pathname === "/ask") return null;

  return (
    <>
      <button
        type="button"
        data-testid="ask-trac-launcher"
        aria-label="Ask about Trac"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-ink shadow-lg transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        Ask
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask about Trac"
          data-testid="ask-trac-dialog"
          className="fixed bottom-24 right-6 z-50 flex h-[32rem] w-[min(26rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-xl border border-line-strong bg-bg/95 shadow-2xl backdrop-blur-md"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Ask-Trac
              </h2>
            </div>
            <a
              href="/ask"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:text-accent"
            >
              Full page ↗
            </a>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 font-mono text-xs text-muted transition-colors hover:text-ink motion-reduce:transition-none"
            >
              Esc
            </button>
          </header>

          <Conversation
            variant="panel"
            suggestions={SUGGESTIONS}
            emptyPrompt="Ask anything about Trac's work, projects and experience."
          />
        </div>
      ) : null}
    </>
  );
}
