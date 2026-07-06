"use client";

import { GenerativeUIRenderer } from "./generative-ui";
import { ArtifactSandbox } from "./artifact-sandbox";
import { ReactArtifactSandbox } from "./react-artifact-sandbox";
import { MarkdownRenderer } from "./markdown/markdown-renderer";
import type { ChatMessage } from "./types";

export function MessageList({
  messages,
  onFollowup,
}: {
  messages: ChatMessage[];
  onFollowup?: (text: string) => void;
}) {
  return (
    <div className="space-y-6">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
              {message.content}
            </div>
          </div>
        ) : (
          <div
            key={message.id}
            data-testid="assistant-message"
            className="space-y-3"
          >
            {message.reasoning.length > 0 ? (
              <details
                data-testid="reasoning-trail"
                className="rounded-md border border-line bg-surface/60 px-3 py-2"
              >
                <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  Reasoning
                </summary>
                <ol className="mt-2 space-y-1 text-xs text-muted">
                  {message.reasoning.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-faint tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}

            {message.content ? (
              <MarkdownRenderer>{message.content}</MarkdownRenderer>
            ) : null}

            {message.ui.map((component, i) => (
              <GenerativeUIRenderer key={i} component={component} />
            ))}

            {message.artifacts.map((artifact) => (
              <ArtifactSandbox
                key={artifact.id}
                html={artifact.html}
                title={artifact.title}
              />
            ))}

            {message.reactWidgets.map((widget) => (
              <ReactArtifactSandbox
                key={widget.id}
                code={widget.code}
                data={widget.data}
                title={widget.title}
              />
            ))}

            {message.error ? (
              <p className="font-mono text-xs text-accent">
                <span className="uppercase tracking-[0.18em]">Error</span> —{" "}
                {message.error}
              </p>
            ) : null}

            {message.followups.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {message.followups.map((question, i) => (
                  <button
                    key={i}
                    type="button"
                    data-testid="followup"
                    onClick={() => onFollowup?.(question)}
                    className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ),
      )}
    </div>
  );
}
