import { describe, it, expect } from "vitest";
import { validateReactCode } from "./react-validator";

const GOOD = `function Widget({ data }) {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(o => !o)}>{open ? "hide" : "show"}</button>;
}`;

describe("validateReactCode", () => {
  it("accepts a self-contained Widget component", () => {
    expect(validateReactCode(GOOD).ok).toBe(true);
  });

  it("rejects empty code", () => {
    expect(validateReactCode("").ok).toBe(false);
  });

  it("requires a Widget definition", () => {
    const r = validateReactCode("const x = 1;");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Widget/);
  });

  it.each([
    ["import x from 'y'; function Widget(){return null}", "import"],
    ["function Widget(){ fetch('/x'); return null }", "fetch"],
    ["function Widget(){ return document.cookie }", "cookie"],
    ["function Widget(){ eval('1'); return null }", "eval"],
    ["function Widget(){ while(true){}; return null }", "while(true)"],
    ["function Widget(){ localStorage.getItem('x'); return null }", "localStorage"],
    ["function Widget(){ window.parent.postMessage('x'); return null }", "parent"],
  ])("rejects code containing %s", (code) => {
    expect(validateReactCode(code).ok).toBe(false);
  });

  it("rejects oversized code", () => {
    const big = "function Widget(){ return null } " + "/*".padEnd(9000, "x");
    expect(validateReactCode(big).ok).toBe(false);
  });
});
