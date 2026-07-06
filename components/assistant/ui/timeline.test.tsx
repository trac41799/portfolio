import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "./timeline";

describe("Timeline", () => {
  it("renders each item's title", () => {
    render(
      <Timeline
        items={[
          { date: "2025", title: "Edge8 AI", detail: "AI engineer" },
          { date: "2023", title: "Freelance" },
        ]}
      />,
    );
    expect(screen.getByText("Edge8 AI")).toBeInTheDocument();
    expect(screen.getByText("AI engineer")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });
});
