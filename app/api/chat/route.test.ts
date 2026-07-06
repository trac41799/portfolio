import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";

function makeRequest(content: string): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = "fake";
  });

  it("returns an SSE stream that ends with a done event", async () => {
    const res = await POST(makeRequest("What did he build at Edge8 AI?"));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: content");
    expect(text).toContain("event: done");
  });

  it("streams a ui event for a comparison request", async () => {
    const res = await POST(makeRequest("Compare the LMS and Travel Buddy projects"));
    const text = await res.text();
    expect(text).toContain("event: ui");
    expect(text).toContain("event: done");
  });

  it("emits an error for an empty request", async () => {
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    const text = await res.text();
    expect(text).toContain("event: error");
    expect(text).toContain("event: done");
  });
});
