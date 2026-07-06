import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "./message-list";
import type { ChatMessage } from "./types";

const message: ChatMessage = {
  id: "1",
  role: "assistant",
  content: "Here is a comparison.",
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
  followups: ["Tell me more", "Show the timeline"],
};

describe("MessageList", () => {
  it("renders ui components and followup chips", () => {
    render(<MessageList messages={[message]} />);
    expect(screen.getByTestId("ui-comparison")).toBeInTheDocument();
    expect(screen.getAllByTestId("followup")).toHaveLength(2);
  });
});
