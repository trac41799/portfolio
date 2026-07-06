"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "./markdown/markdown-renderer";
import { StreamingCaret } from "./streaming-caret";
import { useRevealEngine } from "./use-reveal-engine";

/** Reveals streamed markdown with a smooth, engine-driven unfolding. The
 *  revealed prefix is always rendered through the Markdown pipeline, so raw
 *  markdown/`html-inline` source never flashes as plain text; a caret shows
 *  while the reveal is still catching up or the stream is active. */
export function RevealText({
  content,
  streaming,
}: {
  content: string;
  streaming: boolean;
}) {
  const [revealed, setRevealed] = useState(0);
  const revealedRef = useRef(0);
  revealedRef.current = revealed;
  const { start, stop } = useRevealEngine();

  useEffect(() => {
    start({
      startCount: Math.min(revealedRef.current, content.length),
      targetCount: content.length,
      speedMs: 6,
      onReveal: setRevealed,
    });
    return () => stop();
  }, [content, start, stop]);

  const caughtUp = revealed >= content.length;
  const shown = caughtUp ? content : content.slice(0, Math.max(revealed, 0));

  return (
    <div>
      <MarkdownRenderer>{shown}</MarkdownRenderer>
      {streaming || !caughtUp ? <StreamingCaret /> : null}
    </div>
  );
}
