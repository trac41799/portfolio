"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAskTrac } from "./use-ask-trac";
import { MessageList } from "./message-list";

export function Conversation({
  variant,
  suggestions,
  emptyPrompt,
  className = "",
}: {
  variant: "panel" | "page";
  suggestions: readonly string[];
  emptyPrompt?: string;
  className?: string;
}) {
  const { messages, isStreaming, send } = useAskTrac();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isPage = variant === "page";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${isPage ? "px-1 py-2" : "px-4 py-4"}`}
      >
        {messages.length === 0 ? (
          <div className={isPage ? "mx-auto max-w-2xl py-4" : "space-y-4"}>
            {emptyPrompt ? (
              <p
                className={
                  isPage
                    ? "text-center text-base leading-relaxed text-muted"
                    : "text-sm leading-relaxed text-muted"
                }
              >
                {emptyPrompt}
              </p>
            ) : null}
            <div
              className={
                isPage
                  ? "mt-6 grid gap-2 sm:grid-cols-2"
                  : "flex flex-col gap-2"
              }
            >
              {suggestions.map((suggestion) => (
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
          <div className={isPage ? "mx-auto max-w-2xl" : ""}>
            <MessageList messages={messages} onFollowup={submit} />
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className={isPage ? "mt-4 border-t border-line pt-4" : "border-t border-line p-3"}
      >
        <div
          className={
            isPage
              ? "mx-auto flex max-w-2xl items-center gap-2"
              : "flex items-center gap-2"
          }
        >
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
  );
}
