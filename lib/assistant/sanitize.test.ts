import { describe, it, expect } from "vitest";
import { sanitizeArtifact } from "./sanitize";

describe("sanitizeArtifact", () => {
  const out = sanitizeArtifact(
    '<script>alert(1)</script><div onclick="x()">ok</div>',
  );

  it("keeps safe text content", () => {
    expect(out).toContain("ok");
  });

  it("strips script tags", () => {
    expect(out.includes("<script")).toBe(false);
  });

  it("strips inline event handlers", () => {
    expect(out.includes("onclick")).toBe(false);
  });

  it("removes javascript: urls", () => {
    const result = sanitizeArtifact('<a href="javascript:alert(1)">x</a>');
    expect(result.includes("javascript:")).toBe(false);
  });

  it("wraps with a CSP meta and a style block", () => {
    expect(out).toContain("Content-Security-Policy");
    expect(out).toContain("<style");
  });

  it("stays a reasonable length for small input", () => {
    expect(out.length).toBeLessThan(5000);
  });
});
