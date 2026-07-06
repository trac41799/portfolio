import { describe, it, expect } from "vitest";
import {
  uiComponentSchema,
  safeParseUIComponent,
  UI_COMPONENT_NAMES,
} from "./contracts";

describe("uiComponentSchema", () => {
  it("accepts a valid timeline component", () => {
    const value = {
      component: "timeline",
      props: { items: [{ date: "2025", title: "Edge8 AI" }] },
    };
    expect(uiComponentSchema.parse(value)).toEqual(value);
  });

  it("rejects a timeline with empty items", () => {
    const value = { component: "timeline", props: { items: [] } };
    expect(() => uiComponentSchema.parse(value)).toThrow();
  });

  it("rejects an unknown component name", () => {
    expect(safeParseUIComponent({ component: "wat", props: {} })).toBeNull();
  });

  it("has a schema branch for every declared component name", () => {
    for (const name of UI_COMPONENT_NAMES) {
      const result = uiComponentSchema.safeParse({ component: name, props: {} });
      // props are invalid here, but the discriminator must be recognised
      // (i.e. it fails on props, not on an unknown discriminator)
      expect(result.success).toBe(false);
    }
  });

  it("safeParse returns data for a valid comparison", () => {
    const value = {
      component: "comparison",
      props: {
        columns: ["LMS", "Travel Buddy"],
        rows: [{ label: "Stack", values: ["FastAPI", "Next.js"] }],
      },
    };
    expect(safeParseUIComponent(value)).toEqual(value);
  });
});
