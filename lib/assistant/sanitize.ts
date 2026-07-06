const ALLOWED_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "div",
  "span",
  "strong",
  "em",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "section",
  "header",
  "footer",
  "small",
  "a",
  "img",
  "style",
]);

const MAX_LENGTH = 32768;

const CSP =
  "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src https:";

const THEME_STYLE = [
  ":root{",
  "--bg:#0b0b0c;",
  "--ink:#ededea;",
  "--accent:#e5b567;",
  "--muted:#8c8c86;",
  "}",
  "body{",
  "background:var(--bg);",
  "color:var(--ink);",
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
  "margin:0;padding:24px;line-height:1.5;",
  "}",
  "a{color:var(--accent);}",
  "small,.muted{color:var(--muted);}",
  "h1,h2,h3,h4{color:var(--ink);}",
  "table{border-collapse:collapse;}",
  "th,td{border:1px solid var(--muted);padding:6px 10px;text-align:left;}",
].join("");

function stripDangerous(html: string): string {
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<script[\s\S]*?>/gi, "");
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  out = out.replace(
    /\b(href|src)\s*=\s*"\s*javascript:[^"]*"/gi,
    '$1="#"',
  );
  out = out.replace(
    /\b(href|src)\s*=\s*'\s*javascript:[^']*'/gi,
    "$1='#'",
  );
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) =>
    ALLOWED_TAGS.has(String(tag).toLowerCase()) ? match : "",
  );
  return out;
}

export function sanitizeArtifact(rawHtml: string): string {
  const truncated = rawHtml.slice(0, MAX_LENGTH);
  const inner = stripDangerous(truncated);
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
    `<style>${THEME_STYLE}</style>`,
    "</head>",
    `<body>${inner}</body>`,
    "</html>",
  ].join("");
}
