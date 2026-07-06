import { describe, it, expect } from "vitest";
import { toSSE, parseSSE, type AssistantEvent } from "./events";

const samples: AssistantEvent[] = [
  { type: "reasoning", step: "Reading his work" },
  { type: "content", text: "Line one\nLine two — with emoji 🚀 and <b>tags</b> & \"quotes\"" },
  {
    type: "ui",
    component: {
      component: "timeline",
      props: { items: [{ date: "2025", title: "Edge8 AI", detail: "AI eng" }] },
    },
  },
  { type: "artifact", id: "a1", title: "Summary", html: '<div class="x">Hi & bye</div>\n<p>ok</p>' },
  { type: "artifact_replaced", id: "a1", html: "<div>enhanced</div>" },
  { type: "followups", questions: ["What next?", "Show research"] },
  { type: "error", message: "boom" },
  { type: "done" },
];

describe("SSE round-trip", () => {
  for (const event of samples) {
    it(`round-trips a ${event.type} event`, () => {
      const wire = toSSE(event);
      expect(wire.startsWith(`event: ${event.type}\n`)).toBe(true);
      expect(wire.endsWith("\n\n")).toBe(true);
      const parsed = parseSSE(wire);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(event);
    });
  }

  it("parses multiple concatenated blocks in order", () => {
    const stream = samples.map(toSSE).join("");
    const parsed = parseSSE(stream);
    expect(parsed).toEqual(samples);
  });

  it("returns [] for a malformed chunk instead of throwing", () => {
    expect(parseSSE("event: content\ndata: {not json\n\n")).toEqual([]);
    expect(parseSSE("garbage without data line")).toEqual([]);
    expect(parseSSE("")).toEqual([]);
  });
});
