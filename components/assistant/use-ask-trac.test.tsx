import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { toSSE, type AssistantEvent } from "@/lib/assistant/events";
import { useAskTrac } from "./use-ask-trac";

function streamFromEvents(
  events: AssistantEvent[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(toSSE(event)));
      }
      controller.close();
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAskTrac", () => {
  it("folds a stream of events into the assistant message", async () => {
    const events: AssistantEvent[] = [
      { type: "reasoning", step: "Reading his work" },
      { type: "content", text: "Hello" },
      {
        type: "ui",
        component: {
          component: "comparison",
          props: {
            columns: ["Aspect", "LMS"],
            rows: [{ label: "Stack", values: ["Next.js"] }],
          },
        },
      },
      { type: "followups", questions: ["Q1"] },
      { type: "done" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: true, body: streamFromEvents(events) }) as unknown as Response,
      ),
    );

    const { result } = renderHook(() => useAskTrac());

    await act(async () => {
      await result.current.send("hi");
    });

    await waitFor(() => {
      expect(result.current.messages.at(-1)?.content).toBe("Hello");
    });

    const last = result.current.messages.at(-1);
    expect(last?.role).toBe("assistant");
    expect(last?.content).toBe("Hello");
    expect(last?.ui).toHaveLength(1);
    expect(last?.ui[0]?.component).toBe("comparison");
    expect((last?.reasoning.length ?? 0) >= 1).toBe(true);
    expect(last?.followups).toEqual(["Q1"]);
    expect(result.current.isStreaming).toBe(false);
  });

  it("sets an error on the assistant message when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const { result } = renderHook(() => useAskTrac());

    await act(async () => {
      await result.current.send("hi");
    });

    const last = result.current.messages.at(-1);
    expect(last?.error).toBeDefined();
    expect(result.current.isStreaming).toBe(false);
  });
});
