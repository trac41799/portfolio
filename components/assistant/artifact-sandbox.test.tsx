import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactSandbox } from "./artifact-sandbox";

describe("ArtifactSandbox", () => {
  it("renders a sandboxed iframe without script or same-origin permissions", () => {
    render(<ArtifactSandbox html="<p>Hello artifact</p>" title="Summary" />);
    const frame = screen.getByTestId("artifact-frame");
    expect(frame).toHaveAttribute("srcdoc", "<p>Hello artifact</p>");
    expect(frame).toHaveAttribute("title", "Summary");
    const sandbox = frame.getAttribute("sandbox") ?? "";
    expect(sandbox).not.toContain("allow-scripts");
    expect(sandbox).not.toContain("allow-same-origin");
  });

  it("shows a skeleton placeholder when html is empty", () => {
    render(<ArtifactSandbox html="" />);
    expect(screen.getByTestId("artifact-skeleton")).toBeInTheDocument();
  });
});
