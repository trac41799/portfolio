"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAskTrac } from "./use-ask-trac";
import { MessageList } from "./message-list";

const SUGGESTIONS = [
  "What did he build at Edge8 AI?",
  "Compare the LMS and Travel Buddy projects",
  "Show his career timeline",
  "Design a one-page recruiter summary",
] as const;

export function AskTrac() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isStreaming, send } = useAskTrac();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setInput("");
      void send(trimmed);
    },
    [isStreaming, send],
  );

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
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 font-mono text-xs text-muted transition-colors hover:text-ink motion-reduce:transition-none"
            >
              Esc
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted">
                  Ask anything about Trac&apos;s work, projects and experience.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      data-testid="suggestion"
                      onClick={() => submit(suggestion)}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <MessageList messages={messages} onFollowup={submit} />
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(input);
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                data-testid="ask-trac-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about Trac…"
                aria-label="Ask a question"
                className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-line-strong focus:outline-none"
              />
              <button
                type="submit"
                data-testid="ask-trac-send"
                disabled={isStreaming}
                className="rounded-md border border-line-strong px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
