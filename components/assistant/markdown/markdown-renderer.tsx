"use client";

import React, { useMemo } from "react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "./code-block";
import { HtmlInline } from "./html-inline";
import { MermaidRenderer } from "./mermaid-renderer";

// ---------------------------------------------------------------------------
// html-inline fence pre-processor (adapted from aiolabz-fe MarkdownRenderer):
// split the raw markdown at ```html-inline boundaries so the literal fence tag
// never reaches react-markdown; complete blocks render via <HtmlInline>.
// ---------------------------------------------------------------------------

type Segment =
  | { type: "markdown"; content: string }
  | { type: "html-inline"; content: string; complete: boolean };

function splitHtmlInline(text: string): Segment[] {
  const segs: Segment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const openIdx = text.indexOf("```html-inline", cursor);
    if (openIdx === -1) {
      const rest = text.slice(cursor);
      if (rest) segs.push({ type: "markdown", content: rest });
      break;
    }
    if (openIdx > cursor) {
      segs.push({ type: "markdown", content: text.slice(cursor, openIdx) });
    }
    const lineEnd = text.indexOf("\n", openIdx);
    if (lineEnd === -1) {
      segs.push({ type: "html-inline", content: "", complete: false });
      break;
    }
    const bodyStart = lineEnd + 1;
    const closeIdx = text.indexOf("\n```", bodyStart);
    if (closeIdx === -1) {
      segs.push({
        type: "html-inline",
        content: text.slice(bodyStart),
        complete: false,
      });
      break;
    }
    segs.push({
      type: "html-inline",
      content: text.slice(bodyStart, closeIdx),
      complete: true,
    });
    const afterClose = text.indexOf("\n", closeIdx + 4);
    cursor = afterClose === -1 ? text.length : afterClose + 1;
  }

  return segs.length ? segs : [{ type: "markdown", content: text }];
}

// Convert literal "\n" and single newlines to hard breaks, except inside GFM
// table blocks where row newlines must be preserved.
function normalize(markdown: string): string {
  const out = (markdown ?? "").replace(/\\n/g, "\n");
  return out
    .split(/\n\n+/)
    .map((block) => {
      const looksLikeTable = /\|[^\n]*\|/.test(block) && /\|[\s\-:]+\|/.test(block);
      if (looksLikeTable) return block;
      return block.replace(/(?<!\n)\n(?!\n)/g, "  \n");
    })
    .join("\n\n");
}

const components: Components = {
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-ink last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc pl-5 text-sm text-ink [&>li]:mb-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal pl-5 text-sm text-ink [&>li]:mb-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 font-serif text-2xl text-ink first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 font-serif text-xl text-ink first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-base font-semibold text-ink first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-2 text-sm font-semibold text-ink first:mt-0">{children}</h4>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-4 border-line" />,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-accent/50 pl-3 text-sm italic text-muted">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-line">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-line last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top text-ink">{children}</td>,
  pre: ({ children }) => <>{children}</>,
  code: (props) => {
    const { className, children } = props as {
      className?: string;
      children?: React.ReactNode;
    };
    const cls = className ?? "";
    const raw = String(children ?? "");
    const isBlock = /language-[\w-]+/.test(cls) || raw.includes("\n");
    if (!isBlock) {
      return (
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
          {children}
        </code>
      );
    }
    const language = /language-([\w-]+)/.exec(cls)?.[1] ?? "text";
    if (language === "mermaid") return <MermaidRenderer content={raw} />;
    if (language === "html-inline") return <HtmlInline content={raw} />;
    return <CodeBlock code={raw.replace(/\n$/, "")} language={language} />;
  },
};

const StableMarkdown = React.memo(
  function StableMarkdown({ content }: { content: string }) {
    const normalized = useMemo(() => normalize(content), [content]);
    return (
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {normalized}
      </Markdown>
    );
  },
  (prev, next) => prev.content === next.content,
);

export function MarkdownRenderer({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const segments = useMemo(() => splitHtmlInline(children ?? ""), [children]);
  return (
    <div className={`md-content max-w-full ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "html-inline") {
          if (!seg.complete) return null;
          return <HtmlInline key={idx} content={seg.content} />;
        }
        return <StableMarkdown key={idx} content={seg.content} />;
      })}
    </div>
  );
}
