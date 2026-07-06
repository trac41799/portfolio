"use client";

import { useCallback, useState } from "react";

export function CodeBlock({
  code,
  language,
  title,
}: {
  code: string;
  language?: string | null;
  title?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }, [code]);

  return (
    <div className="group relative my-3 overflow-hidden rounded-md border border-line bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          {title ?? language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="font-mono text-[10px] text-muted transition-colors hover:text-accent"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-ink">
        <code className={language ? `language-${language}` : undefined}>
          {code}
        </code>
      </pre>
    </div>
  );
}
