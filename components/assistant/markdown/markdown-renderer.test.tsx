import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "./markdown-renderer";

describe("MarkdownRenderer", () => {
  it("renders bold text as <strong>", () => {
    render(<MarkdownRenderer>{"This is **bold text** here"}</MarkdownRenderer>);
    const el = screen.getByText("bold text");
    expect(el.tagName).toBe("STRONG");
  });

  it("renders a bullet list as <li> items", () => {
    render(<MarkdownRenderer>{"- one\n- two\n- three"}</MarkdownRenderer>);
    expect(screen.getByText("one").closest("li")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders inline code as <code>", () => {
    render(<MarkdownRenderer>{"install with `npm test` please"}</MarkdownRenderer>);
    expect(screen.getByText("npm test").tagName).toBe("CODE");
  });

  it("renders a GFM table", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    render(<MarkdownRenderer>{md}</MarkdownRenderer>);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("routes an html-inline fence to the sandboxed HtmlInline host and hides the raw fence", () => {
    const md = "Here is a card:\n\n```html-inline\n<div>hi card</div>\n```\n\nDone.";
    render(<MarkdownRenderer>{md}</MarkdownRenderer>);
    expect(screen.getByTestId("html-inline")).toBeInTheDocument();
    // the literal fence language must never reach the DOM as text
    expect(screen.queryByText(/html-inline/)).toBeNull();
    // surrounding markdown still renders
    expect(screen.getByText("Done.")).toBeInTheDocument();
  });

  it("does not throw on empty input", () => {
    expect(() => render(<MarkdownRenderer>{""}</MarkdownRenderer>)).not.toThrow();
  });
});
