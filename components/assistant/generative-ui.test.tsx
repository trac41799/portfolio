import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenerativeUIRenderer } from "./generative-ui";
import type { UIComponent } from "@/lib/assistant/contracts";

describe("GenerativeUIRenderer", () => {
  it("renders the matching component for a valid ui payload", () => {
    const component: UIComponent = {
      component: "timeline",
      props: { items: [{ date: "2025", title: "Edge8 AI" }] },
    };
    render(<GenerativeUIRenderer component={component} />);
    expect(screen.getByTestId("ui-timeline")).toBeInTheDocument();
    expect(screen.getByText("Edge8 AI")).toBeInTheDocument();
  });

  it("renders a graceful fallback for an invalid payload without throwing", () => {
    const bad = { component: "nope" } as unknown as UIComponent;
    expect(() => render(<GenerativeUIRenderer component={bad} />)).not.toThrow();
    expect(
      screen.getByText("Unable to render this content."),
    ).toBeInTheDocument();
  });
});
