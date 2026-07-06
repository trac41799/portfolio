"use client";

import { useCallback, useRef, useState } from "react";
import { parseSSE, type AssistantEvent } from "@/lib/assistant/events";
import type { ChatMessage } from "./types";

export interface UseAskTrac {
  messages: ChatMessage[];
  isStreaming: boolean;
  send: (text: string) => Promise<void>;
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    status: role === "assistant" ? "thinking" : "done",
    reasoning: [],
    ui: [],
    artifacts: [],
    reactWidgets: [],
    followups: [],
  };
}

type Updater = (fn: (message: ChatMessage) => ChatMessage) => void;

/** Apply a discrete (infrequent) event immediately. Content deltas are handled
 *  separately via requestAnimationFrame coalescing for smooth, cheap rendering. */
function applyDiscreteEvent(update: Updater, event: AssistantEvent): void {
  switch (event.type) {
    case "reasoning":
      update((m) => ({ ...m, reasoning: [...m.reasoning, event.step] }));
      break;
    case "ui":
      update((m) => ({ ...m, ui: [...m.ui, event.component] }));
      break;
    case "artifact":
      update((m) => ({
        ...m,
        artifacts: [
          ...m.artifacts,
          { id: event.id, title: event.title, html: event.html },
        ],
      }));
      break;
    case "artifact_replaced":
      update((m) => ({
        ...m,
        artifacts: m.artifacts.map((a) =>
          a.id === event.id ? { ...a, html: event.html } : a,
        ),
      }));
      break;
    case "react_artifact":
      update((m) => ({
        ...m,
        reactWidgets: [
          ...m.reactWidgets,
          { id: event.id, title: event.title, code: event.code, data: event.data },
        ],
      }));
      break;
    case "followups":
      update((m) => ({ ...m, followups: event.questions }));
      break;
    case "error":
      update((m) => ({ ...m, error: event.message, status: "done" }));
      break;
    case "content":
    case "done":
      break;
  }
}

export function useAskTrac(): UseAskTrac {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const send = useCallback(async (text: string) => {
    const userMessage = createMessage("user", text);
    const assistantMessage = createMessage("assistant", "");
    const assistantId = assistantMessage.id;
    const requestMessages = [...messagesRef.current, userMessage];

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const update: Updater = (fn) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));
    };

    // --- requestAnimationFrame-coalesced content buffer -------------------
    let pending = "";
    let rafId: number | null = null;
    const hasRaf = typeof requestAnimationFrame === "function";

    const flush = () => {
      rafId = null;
      if (!pending) return;
      const chunk = pending;
      pending = "";
      update((m) => ({
        ...m,
        content: m.content + chunk,
        status: "streaming",
      }));
    };
    const scheduleFlush = () => {
      if (!hasRaf) {
        flush();
        return;
      }
      if (rafId === null) rafId = requestAnimationFrame(flush);
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: requestMessages }),
      });

      const body = response.body;
      if (!body) return;

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const handle = (event: AssistantEvent) => {
        if (event.type === "content") {
          pending += event.text;
          scheduleFlush();
        } else if (event.type === "done") {
          finished = true;
        } else {
          applyDiscreteEvent(update, event);
        }
      };

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const block = buffer.slice(0, boundary + 2);
          buffer = buffer.slice(boundary + 2);
          for (const event of parseSSE(block)) handle(event);
          if (finished) break;
          boundary = buffer.indexOf("\n\n");
        }
      }

      if (buffer.trim()) {
        for (const event of parseSSE(buffer)) handle(event);
      }
    } catch {
      update((m) => ({
        ...m,
        error: "Something went wrong while answering. Please try again.",
      }));
    } finally {
      if (rafId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      // Final synchronous flush so the completed message is fully rendered.
      if (pending) {
        const chunk = pending;
        pending = "";
        update((m) => ({ ...m, content: m.content + chunk }));
      }
      update((m) => ({ ...m, status: "done" }));
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, send };
}
