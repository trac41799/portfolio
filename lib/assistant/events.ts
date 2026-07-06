import type { UIComponent } from "./contracts";

export type AssistantEvent =
  | { type: "reasoning"; step: string }
  | { type: "content"; text: string }
  | { type: "ui"; component: UIComponent }
  | { type: "artifact"; id: string; title: string; html: string }
  | { type: "artifact_replaced"; id: string; html: string }
  | { type: "followups"; questions: string[] }
  | { type: "error"; message: string }
  | { type: "done" };

export type AssistantEventType = AssistantEvent["type"];

// ---- isomorphic UTF-8 base64 (browser + node) ------------------------------

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  if (typeof btoa !== "undefined") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function decodeBase64(b64: string): string {
  if (typeof atob !== "undefined") {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

// ---- wire encoding ---------------------------------------------------------
// content.text / artifact.html / artifact_replaced.html are base64-encoded on
// the wire so arbitrary HTML and newlines survive the SSE `data:` line safely.

function toWire(e: AssistantEvent): Record<string, unknown> {
  switch (e.type) {
    case "content":
      return { type: e.type, text: encodeBase64(e.text) };
    case "artifact":
      return { type: e.type, id: e.id, title: e.title, html: encodeBase64(e.html) };
    case "artifact_replaced":
      return { type: e.type, id: e.id, html: encodeBase64(e.html) };
    default:
      return { ...e };
  }
}

function fromWire(w: Record<string, unknown>): AssistantEvent | null {
  const type = w.type as AssistantEventType | undefined;
  if (!type) return null;
  try {
    switch (type) {
      case "reasoning":
        return { type, step: String(w.step ?? "") };
      case "content":
        return { type, text: decodeBase64(String(w.text ?? "")) };
      case "ui":
        return { type, component: w.component as UIComponent };
      case "artifact":
        return {
          type,
          id: String(w.id ?? ""),
          title: String(w.title ?? ""),
          html: decodeBase64(String(w.html ?? "")),
        };
      case "artifact_replaced":
        return { type, id: String(w.id ?? ""), html: decodeBase64(String(w.html ?? "")) };
      case "followups":
        return { type, questions: (w.questions as string[]) ?? [] };
      case "error":
        return { type, message: String(w.message ?? "") };
      case "done":
        return { type };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** Serialize a single event as an SSE block: `event: <type>\ndata: <json>\n\n`. */
export function toSSE(e: AssistantEvent): string {
  return `event: ${e.type}\ndata: ${JSON.stringify(toWire(e))}\n\n`;
}

/** Parse zero or more complete SSE blocks from a string. Never throws. */
export function parseSSE(chunk: string): AssistantEvent[] {
  const events: AssistantEvent[] = [];
  const blocks = chunk.split("\n\n");
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const dataLine = trimmed
      .split("\n")
      .find((line) => line.startsWith("data:"));
    if (!dataLine) continue;
    const json = dataLine.slice("data:".length).trim();
    try {
      const parsed = fromWire(JSON.parse(json));
      if (parsed) events.push(parsed);
    } catch {
      // ignore malformed block
    }
  }
  return events;
}
