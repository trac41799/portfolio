import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./project-card";

describe("ProjectCard", () => {
  it("renders the title, stack and highlights", () => {
    render(
      <ProjectCard
        slug="lms"
        title="Learning Management System"
        stack={["Next.js", "Postgres"]}
        highlights={["Served 10k learners"]}
        signal="Flagship"
      />,
    );
    expect(screen.getByText("Learning Management System")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Served 10k learners")).toBeInTheDocument();
    expect(screen.getByText("Flagship")).toBeInTheDocument();
  });
});
