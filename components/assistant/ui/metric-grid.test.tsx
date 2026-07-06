import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricGrid } from "./metric-grid";

describe("MetricGrid", () => {
  it("renders each metric value and label", () => {
    render(
      <MetricGrid
        metrics={[
          { value: "10k", label: "Learners" },
          { value: "99.9%", label: "Uptime" },
        ]}
      />,
    );
    expect(screen.getByText("10k")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });
});
