import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { sendSpy } = vi.hoisted(() => ({ sendSpy: vi.fn() }));

vi.mock("./use-ask-trac", () => ({
  useAskTrac: () => ({ messages: [], isStreaming: false, send: sendSpy }),
}));

import { Conversation } from "./conversation";

const SUGGESTIONS = ["Alpha question", "Beta question"] as const;

describe("Conversation", () => {
  it("renders the provided suggestions and a composer", () => {
    render(<Conversation variant="page" suggestions={SUGGESTIONS} />);
    expect(screen.getAllByTestId("suggestion")).toHaveLength(2);
    expect(screen.getByTestId("ask-trac-input")).toBeInTheDocument();
    expect(screen.getByTestId("ask-trac-send")).toBeInTheDocument();
  });

  it("sends a suggestion when its chip is clicked", () => {
    render(<Conversation variant="page" suggestions={SUGGESTIONS} />);
    fireEvent.click(screen.getByText("Alpha question"));
    expect(sendSpy).toHaveBeenCalledWith("Alpha question");
  });

  it("sends the typed input on submit", () => {
    render(<Conversation variant="panel" suggestions={SUGGESTIONS} />);
    fireEvent.change(screen.getByTestId("ask-trac-input"), {
      target: { value: "  What is his stack?  " },
    });
    fireEvent.click(screen.getByTestId("ask-trac-send"));
    expect(sendSpy).toHaveBeenCalledWith("What is his stack?");
  });
});
