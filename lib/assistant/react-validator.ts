export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const MAX_LEN = 8000;

const BANNED: { re: RegExp; label: string }[] = [
  { re: /\bimport\b/, label: "import" },
  { re: /\bexport\b/, label: "export" },
  { re: /\brequire\s*\(/, label: "require()" },
  { re: /\bfetch\s*\(/, label: "fetch()" },
  { re: /XMLHttpRequest/, label: "XMLHttpRequest" },
  { re: /\bWebSocket\b/, label: "WebSocket" },
  { re: /\beval\s*\(/, label: "eval()" },
  { re: /new\s+Function/, label: "new Function" },
  { re: /document\s*\.\s*cookie/, label: "document.cookie" },
  { re: /localStorage/, label: "localStorage" },
  { re: /sessionStorage/, label: "sessionStorage" },
  { re: /\bwindow\s*\.\s*parent\b/, label: "window.parent" },
  { re: /\bwindow\s*\.\s*top\b/, label: "window.top" },
  { re: /\bpostMessage\s*\(/, label: "postMessage()" },
  { re: /while\s*\(\s*true\s*\)/, label: "while(true)" },
  { re: /for\s*\(\s*;\s*;\s*\)/, label: "for(;;)" },
  { re: /<\/script/i, label: "</script>" },
  { re: /dangerouslySetInnerHTML/, label: "dangerouslySetInnerHTML" },
];

const DEFINES_WIDGET =
  /(function\s+Widget\b|(?:const|let|var)\s+Widget\s*=)/;

/** Static allowlist/denylist gate for model-authored React before it is ever
 *  handed to the sandbox. Belt-and-braces on top of the origin-isolated iframe. */
export function validateReactCode(code: string): ValidationResult {
  if (!code || !code.trim()) return { ok: false, reason: "empty code" };
  if (code.length > MAX_LEN) return { ok: false, reason: "code too large" };
  for (const { re, label } of BANNED) {
    if (re.test(code)) return { ok: false, reason: `disallowed token: ${label}` };
  }
  if (!DEFINES_WIDGET.test(code)) {
    return { ok: false, reason: "must define a component named Widget" };
  }
  return { ok: true };
}
