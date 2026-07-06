import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactArtifactSandbox } from "./react-artifact-sandbox";

const CODE = "function Widget({ data }) { return <div>hi</div>; }";

describe("ReactArtifactSandbox", () => {
  it("renders an iframe whose sandbox allows scripts but NOT same-origin", () => {
    render(<ReactArtifactSandbox code={CODE} data={{ n: 1 }} title="Demo" />);
    const frame = screen.getByTestId("react-frame") as HTMLIFrameElement;
    const sandbox = frame.getAttribute("sandbox") ?? "";
    expect(sandbox).toContain("allow-scripts");
    expect(sandbox).not.toContain("allow-same-origin");
  });

  it("injects the component code and a strict CSP into the srcDoc", () => {
    render(<ReactArtifactSandbox code={CODE} />);
    const frame = screen.getByTestId("react-frame") as HTMLIFrameElement;
    const srcdoc = frame.getAttribute("srcdoc") ?? "";
    expect(srcdoc).toContain("function Widget");
    expect(srcdoc).toContain("Content-Security-Policy");
    expect(srcdoc).toContain("connect-src 'none'");
  });

  it("shows a skeleton when no code is present", () => {
    render(<ReactArtifactSandbox code="" />);
    expect(screen.getByTestId("react-skeleton")).toBeInTheDocument();
  });
});
