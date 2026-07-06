import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("./use-ask-trac", () => ({
  useAskTrac: () => ({
    messages: [],
    isStreaming: false,
    send: vi.fn(),
  }),
}));

import { AskTrac } from "./ask-trac";

describe("AskTrac", () => {
  it("exposes an accessible launcher that opens a dialog", () => {
    render(<AskTrac />);
    const launcher = screen.getByRole("button", { name: "Ask about Trac" });
    expect(launcher).toBeInTheDocument();

    fireEvent.click(launcher);
    expect(
      screen.getByRole("dialog", { name: "Ask about Trac" }),
    ).toBeInTheDocument();
  });

  it("renders the four seeded suggestion chips with exact labels", () => {
    render(<AskTrac />);
    fireEvent.click(screen.getByTestId("ask-trac-launcher"));

    expect(screen.getAllByTestId("suggestion")).toHaveLength(4);
    expect(
      screen.getByText("What did he build at Edge8 AI?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Compare the LMS and Travel Buddy projects"),
    ).toBeInTheDocument();
    expect(screen.getByText("Show his career timeline")).toBeInTheDocument();
    expect(
      screen.getByText("Design a one-page recruiter summary"),
    ).toBeInTheDocument();
  });
});
