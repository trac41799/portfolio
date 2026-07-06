import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Comparison } from "./comparison";

describe("Comparison", () => {
  it("renders a column header and a row label", () => {
    render(
      <Comparison
        columns={["Aspect", "LMS", "Travel Buddy"]}
        rows={[{ label: "Stack", values: ["Next.js", "Expo"] }]}
      />,
    );
    expect(screen.getByText("Travel Buddy")).toBeInTheDocument();
    expect(screen.getByText("Stack")).toBeInTheDocument();
    expect(screen.getByText("Expo")).toBeInTheDocument();
  });
});
