import { describe, it, expect } from "vitest";
import { resolveProvider, getBrain } from "./provider";

describe("resolveProvider", () => {
  it("prefers an explicit LLM_PROVIDER over keys", () => {
    expect(
      resolveProvider({ LLM_PROVIDER: "fake", DEEPSEEK_API_KEY: "x" }),
    ).toBe("fake");
  });

  it("falls back to deepseek when its key is present", () => {
    expect(resolveProvider({ DEEPSEEK_API_KEY: "x" })).toBe("deepseek");
  });

  it("falls back to openrouter when its key is present", () => {
    expect(resolveProvider({ OPENROUTER_API_KEY: "x" })).toBe("openrouter");
  });

  it("defaults to fake with no config", () => {
    expect(resolveProvider({})).toBe("fake");
  });
});

describe("getBrain", () => {
  it("returns a fake brain with the Brain shape", () => {
    const brain = getBrain("fake");
    expect(typeof brain.route).toBe("function");
    expect(typeof brain.answer).toBe("function");
    expect(typeof brain.props).toBe("function");
    expect(typeof brain.artifactHtml).toBe("function");
  });
});
