import { describe, it, expect } from "vitest";
import { ruleRoute, isOffTopic } from "./routing";

describe("ruleRoute", () => {
  it("routes a comparison request to the comparison component", () => {
    expect(ruleRoute("Compare the LMS and Travel Buddy projects")).toEqual({
      route: "renderUI",
      component: "comparison",
    });
  });

  it("routes an interactive request to a react widget", () => {
    expect(ruleRoute("show me an interactive skills widget")).toEqual({
      route: "makeReactWidget",
    });
  });

  it("routes a timeline request to the timeline component", () => {
    expect(ruleRoute("show his career timeline")).toEqual({
      route: "renderUI",
      component: "timeline",
    });
  });

  it("returns null for a free-form question (defer to the LLM)", () => {
    expect(ruleRoute("what is his greatest strength?")).toBeNull();
  });

  it("never returns refuse", () => {
    for (const q of ["compare x", "timeline", "skills", "contact", "who is he"]) {
      expect(ruleRoute(q)?.route).not.toBe("refuse");
    }
  });
});

describe("isOffTopic", () => {
  it("flags clearly off-topic queries", () => {
    expect(isOffTopic("what's the weather in Hanoi?")).toBe(true);
    expect(isOffTopic("what is 2 + 2")).toBe(true);
  });

  it("does not flag on-topic project questions", () => {
    expect(isOffTopic("Compare the LMS and Travel Buddy projects")).toBe(false);
    expect(isOffTopic("what did he build at Edge8?")).toBe(false);
  });
});
