import { describe, it, expect } from "vitest";
import { runAssistant } from "./runAssistant";
import { buildGraph } from "./graph";
import { getBrain } from "./provider";
import { uiComponentSchema } from "./contracts";
import { validateReactCode } from "./react-validator";
import type { AssistantEvent } from "./events";
import type { Message } from "./types";

async function collect(
  gen: AsyncGenerator<AssistantEvent>,
): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
}

function ask(query: string): AsyncGenerator<AssistantEvent> {
  const messages: Message[] = [{ role: "user", content: query }];
  return runAssistant({ messages, provider: "fake" });
}

describe("runAssistant", () => {
  it("answers a factual question without UI or artifacts", async () => {
    const events = await collect(ask("What did he build at Edge8 AI?"));
    expect(events.some((e) => e.type === "reasoning")).toBe(true);
    expect(
      events.some((e) => e.type === "content" && e.text.length > 0),
    ).toBe(true);
    expect(events.some((e) => e.type === "followups")).toBe(true);
    expect(events.some((e) => e.type === "ui" || e.type === "artifact")).toBe(
      false,
    );
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("streams the answer as multiple content deltas", async () => {
    const events = await collect(ask("Who is he, in a few sentences?"));
    const contentEvents = events.filter((e) => e.type === "content");
    expect(contentEvents.length).toBeGreaterThanOrEqual(3);
    const full = contentEvents
      .map((e) => (e.type === "content" ? e.text : ""))
      .join("");
    expect(full.length).toBeGreaterThan(50);
  });

  it("emits factual reasoning naming real retrieved sources (not canned labels)", async () => {
    const events = await collect(ask("What did he build at Edge8 AI?"));
    const reasoning = events
      .filter((e) => e.type === "reasoning")
      .map((e) => (e.type === "reasoning" ? e.step : ""));
    expect(reasoning.some((r) => /Found \d+ source/.test(r))).toBe(true);
    expect(reasoning.some((r) => r === "Understanding your question")).toBe(false);
    expect(reasoning.some((r) => r === "Answering")).toBe(false);
  });

  it("renders exactly one valid comparison UI", async () => {
    const events = await collect(
      ask("Compare the LMS and Travel Buddy projects"),
    );
    const uiEvents = events.filter((e) => e.type === "ui");
    expect(uiEvents.length).toBe(1);
    const ui = uiEvents[0];
    if (ui.type !== "ui") throw new Error("expected a ui event");
    expect(ui.component.component).toBe("comparison");
    expect(uiComponentSchema.safeParse(ui.component).success).toBe(true);
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("makes a sanitized artifact", async () => {
    const events = await collect(ask("Design a one-page recruiter summary"));
    const artifacts = events.filter((e) => e.type === "artifact");
    expect(artifacts.length).toBe(1);
    const artifact = artifacts[0];
    if (artifact.type !== "artifact") throw new Error("expected an artifact");
    expect(artifact.html.length).toBeGreaterThan(0);
    expect(artifact.html.includes("<script")).toBe(false);
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("builds a valid, safe interactive React widget", async () => {
    const events = await collect(ask("show an interactive skills widget"));
    const widgets = events.filter((e) => e.type === "react_artifact");
    expect(widgets.length).toBe(1);
    const widget = widgets[0];
    if (widget.type !== "react_artifact") throw new Error("expected a widget");
    expect(widget.code).toMatch(/function Widget/);
    expect(validateReactCode(widget.code).ok).toBe(true);
    expect(events.some((e) => e.type === "ui" || e.type === "artifact")).toBe(
      false,
    );
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("refuses off-topic questions with content only", async () => {
    const events = await collect(ask("what's the weather in Hanoi?"));
    expect(events.some((e) => e.type === "content")).toBe(true);
    expect(events.some((e) => e.type === "ui" || e.type === "artifact")).toBe(
      false,
    );
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("never throws and always ends with done", async () => {
    const events = await collect(ask("tell me about his research"));
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });
});

describe("buildGraph", () => {
  it("streams custom events for the fake brain", async () => {
    const graph = buildGraph(getBrain("fake"));
    const events: AssistantEvent[] = [];
    for await (const chunk of await graph.stream(
      { query: "who is Trac", context: "", route: "" },
      { streamMode: "custom" },
    )) {
      events.push(chunk as AssistantEvent);
    }
    expect(events.some((e) => e.type === "content")).toBe(true);
    expect(events.some((e) => e.type === "reasoning")).toBe(true);
  });
});
