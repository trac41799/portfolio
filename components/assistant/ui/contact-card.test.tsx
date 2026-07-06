import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactCard } from "./contact-card";

describe("ContactCard", () => {
  it("renders a mailto link and external links", () => {
    render(
      <ContactCard
        email="trac@example.com"
        links={[{ label: "GitHub", href: "https://github.com/trac" }]}
      />,
    );
    const mail = screen.getByRole("link", { name: "trac@example.com" });
    expect(mail).toHaveAttribute("href", "mailto:trac@example.com");
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/trac",
    );
  });
});
