import { runAssistant } from "@/lib/assistant/runAssistant";
import { toSSE, type AssistantEvent } from "@/lib/assistant/events";
import type { Message } from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function readMessages(body: unknown): Message[] {
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as { messages?: unknown }).messages)
  ) {
    return (body as { messages: unknown[] }).messages
      .filter(
        (m): m is Message =>
          !!m &&
          typeof m === "object" &&
          (m as Message).role !== undefined &&
          typeof (m as Message).content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content }));
  }
  return [];
}

export async function POST(req: Request): Promise<Response> {
  let messages: Message[] = [];
  try {
    messages = readMessages(await req.json());
  } catch {
    messages = [];
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const limited = rateLimited(ip);
  const hasUser = messages.some((m) => m.role === "user" && m.content.trim());

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AssistantEvent) =>
        controller.enqueue(encoder.encode(toSSE(e)));
      try {
        if (limited) {
          send({
            type: "error",
            message: "Rate limit reached — please try again in a few minutes.",
          });
          send({ type: "done" });
          return;
        }
        if (!hasUser) {
          send({ type: "error", message: "No question provided." });
          send({ type: "done" });
          return;
        }
        for await (const event of runAssistant({ messages })) {
          send(event);
        }
      } catch {
        send({ type: "error", message: "Sorry — something went wrong." });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
