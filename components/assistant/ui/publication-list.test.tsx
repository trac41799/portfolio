import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicationList } from "./publication-list";

describe("PublicationList", () => {
  it("renders each publication citation and venue", () => {
    render(
      <PublicationList
        pubs={[
          {
            citation: "Trac et al., On-Device Inference",
            venue: "NeurIPS",
            year: "2024",
            note: "Workshop paper",
          },
        ]}
      />,
    );
    expect(
      screen.getByText("Trac et al., On-Device Inference"),
    ).toBeInTheDocument();
    expect(screen.getByText(/NeurIPS/)).toBeInTheDocument();
  });
});
