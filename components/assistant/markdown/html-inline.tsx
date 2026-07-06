"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";

// Structural HTML + inline SVG primitives only. DOMPurify strips every on*
// handler and dangerous tag; this is the inline-artifact allowlist adapted
// from the aiolabz-fe HtmlInline renderer.
const ALLOWED_TAGS = [
  "div", "span", "p", "strong", "em", "b", "i", "u", "br", "hr", "small",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "code", "pre", "blockquote",
  "a", "img",
  "svg", "path", "circle", "rect", "line", "text", "g", "polyline", "polygon",
  "details", "summary",
];

const ALLOWED_ATTR = [
  "class", "style", "id", "title", "role", "aria-label", "aria-hidden",
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "viewBox", "xmlns", "fill", "stroke", "d", "x", "y", "r", "cx", "cy",
  "x1", "y1", "x2", "y2", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "points", "transform", "opacity",
];

const PURIFY_CFG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "oninput"],
  ALLOW_DATA_ATTR: false,
};

const HOST_STYLE = `
  :host { all: initial; display: block; margin: 10px 0;
    font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
    color: #ededea; font-size: 14px; line-height: 1.55; }
  :host * { box-sizing: border-box; }
  a { color: #e5b567; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

/** Renders sanitized inline HTML in a shadow root so its styles never leak
 *  into (or inherit unexpectedly from) the page. */
export function HtmlInline({ content }: { content: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = hostRef.current;
    if (!host) return;
    if (!shadowRef.current) {
      try {
        shadowRef.current = host.attachShadow({ mode: "open" });
      } catch {
        setFallback(true);
        return;
      }
    }
    const shadow = shadowRef.current;
    if (!shadow) return;
    const clean = DOMPurify.sanitize(content, PURIFY_CFG);
    shadow.innerHTML = `<style>${HOST_STYLE}</style>${clean}`;
  }, [content]);

  if (fallback) {
    return (
      <iframe
        data-testid="html-inline"
        title="inline content"
        srcDoc={content}
        sandbox=""
        className="my-2 w-full rounded-md border border-line"
      />
    );
  }

  return <div ref={hostRef} data-testid="html-inline" />;
}
