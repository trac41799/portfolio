"use client";

import { useEffect, useState } from "react";

/** Lazily loads mermaid on the client only when a mermaid block appears,
 *  keeping it out of the initial bundle. Falls back to a code block on error. */
export function MermaidRenderer({ content }: { content: string }) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
        });
        const id = `m${Math.random().toString(36).slice(2)}`;
        const { svg: out } = await mermaid.render(id, content.trim());
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setSvg("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!svg) {
    return (
      <pre className="my-3 overflow-x-auto rounded-md border border-line bg-black/40 p-3 text-xs text-muted">
        {content}
      </pre>
    );
  }

  return (
    <div
      data-testid="mermaid"
      className="my-3 flex justify-center [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
