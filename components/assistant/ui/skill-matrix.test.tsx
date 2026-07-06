import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillMatrix } from "./skill-matrix";

describe("SkillMatrix", () => {
  it("renders group names and items", () => {
    render(
      <SkillMatrix
        groups={[
          { name: "Languages", items: ["TypeScript", "Python"] },
          { name: "Infra", items: ["Docker"] },
        ]}
      />,
    );
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });
});
