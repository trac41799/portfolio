import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "./message-list";
import type { ChatMessage } from "./types";

const message: ChatMessage = {
  id: "1",
  role: "assistant",
  content: "Here is a comparison.",
  status: "done",
  reasoning: [],
  ui: [
    {
      component: "comparison",
      props: {
        columns: ["Aspect", "LMS", "Travel Buddy"],
        rows: [{ label: "Stack", values: ["Next.js", "Expo"] }],
      },
    },
  ],
  artifacts: [],
  reactWidgets: [],
  followups: ["Tell me more", "Show the timeline"],
};

describe("MessageList", () => {
  it("renders ui components and followup chips", () => {
    render(<MessageList messages={[message]} />);
    expect(screen.getByTestId("ui-comparison")).toBeInTheDocument();
    expect(screen.getAllByTestId("followup")).toHaveLength(2);
  });

  it("renders a sandboxed React widget frame", () => {
    const withWidget: ChatMessage = {
      ...message,
      id: "2",
      ui: [],
      followups: [],
      reactWidgets: [
        {
          id: "r1",
          title: "Interactive view",
          code: "function Widget(){ return <div>hi</div>; }",
          data: { n: 1 },
        },
      ],
    };
    render(<MessageList messages={[withWidget]} />);
    const frame = screen.getByTestId("react-frame") as HTMLIFrameElement;
    expect(frame.getAttribute("sandbox")).toContain("allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
  });

  it("shows a typing indicator while thinking with no content yet", () => {
    const thinking: ChatMessage = {
      ...message,
      id: "3",
      content: "",
      status: "thinking",
      ui: [],
      followups: [],
    };
    render(<MessageList messages={[thinking]} />);
    expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
  });
});
