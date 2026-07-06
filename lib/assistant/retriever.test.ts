import { describe, it, expect } from "vitest";
import { retrieve, buildCorpus } from "./retriever";

describe("buildCorpus", () => {
  it("produces a non-empty set of docs", () => {
    expect(buildCorpus().length).toBeGreaterThan(0);
  });
});

describe("retrieve", () => {
  it("finds publications and surfaces IEEE", () => {
    const docs = retrieve("publications");
    expect(docs.length).toBeGreaterThan(0);
    const joined = docs.map((d) => `${d.text} ${d.source}`).join(" ");
    expect(joined).toMatch(/IEEE/);
  });

  it("finds Edge8 as the top result", () => {
    const docs = retrieve("Edge8");
    expect(docs.length).toBeGreaterThan(0);
    expect(`${docs[0].text} ${docs[0].source}`).toMatch(/Edge8/);
  });

  it("returns [] for empty or whitespace queries", () => {
    expect(retrieve("")).toEqual([]);
    expect(retrieve("   ")).toEqual([]);
  });

  it("is deterministic across calls", () => {
    expect(retrieve("AI engineer", 3)).toEqual(retrieve("AI engineer", 3));
  });
});
