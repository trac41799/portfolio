# "Ask About Me" — Dedicated Page System Design

> **Status:** Design proposal (review gate before build)
> **Scope:** A full-page, chatbot-first experience at `/ask` on the `nguyendangtrac` portfolio.
> **Builds on:** the existing Ask-Trac assistant (LangGraph.js graph, SSE protocol, MarkdownRenderer,
> generative-UI registry, sandboxed HTML artifacts). This design adds a **dedicated page shell** and a
> **fourth render mode: safely-executed generated React code**.

---

## 1. Reading the requirement (your words → system properties)

| Your words | System property it implies |
|---|---|
| "an entire page dedicated for 'Ask About Me'" | A real route `/ask`, linkable, SEO-described, in the nav — not just the floating widget. |
| "acts like a LLM chatbot-first UX" | Conversation is the primary surface: empty-state prompt front-and-center, then a focused transcript. Everything else is secondary. |
| "lets user ask and then receive interactive responses" | Streaming request→response loop; responses are **interactive**, not static text. |
| "rendered from generated HTML **or react codes**" | Two code-execution render modes: sandboxed **HTML** (have) and sandboxed **React/JSX** (new). |
| "pre-templated dynamic components" | The typed generative-UI registry (timeline, comparison, …) — data-driven, brand-safe (have). |
| "and Markdown LLM responses" | Rich Markdown via the adopted `aiolabz-fe` pipeline (have). |
| "robust system" | Safety (sandbox isolation), determinism (testable), graceful degradation, streaming resilience, a11y, mobile, cost/rate limits. |

**One-line vision:** *A dedicated conversational page where the agent answers about Trac by streaming a
sequence of typed blocks — Markdown, pre-templated components, sandboxed HTML, and sandboxed React —
composed into one coherent, interactive reply.*

---

## 2. The core idea: a response is a **stream of typed blocks**

Today a reply is a loose set of events (`content`, `ui`, `artifact`). To support mixed, ordered,
interactive replies, formalize the reply as an ordered list of **blocks**, each tagged with a render
mode. The agent emits blocks; the page renders each with the matching renderer, in order.

```ts
type Block =
  | { kind: "markdown";  md: string }                         // rich text (GFM + html-inline)
  | { kind: "component"; component: UIComponent }             // pre-templated, typed, data-driven
  | { kind: "html";      id: string; title?: string; html: string }   // generated HTML (sandboxed iframe)
  | { kind: "react";     id: string; title?: string; code: string; data?: unknown } // generated React (sandboxed runtime)
```

- A message = `{ role, blocks: Block[], reasoning: string[], followups: string[], error? }`.
- Order is preserved (a reply can be: prose → comparison component → "and here's an interactive view" → React block).
- Every block kind has a dedicated, independently-tested renderer. Unknown kinds degrade to Markdown/text.

This subsumes the current events (content→markdown block, ui→component block, artifact→html block) and
adds `react`. It also future-proofs: new modes are new `kind`s, nothing else changes.

---

## 3. Render modes (four) and their renderers

| Mode | Renderer | Trust model | Use for |
|---|---|---|---|
| **Markdown** | `MarkdownRenderer` (existing) | Model text; `html-inline` sub-fences sanitized (DOMPurify) in a shadow root | Explanations, lists, tables, code |
| **Pre-templated component** | `GenerativeUIRenderer` (existing) | **Fully trusted** — real React from our design system; agent supplies **data only** (Zod-validated) | Structured facts: timeline, comparison, metrics, skills, publications, contact, project card |
| **Generated HTML** | `ArtifactSandbox` (existing) | **Untrusted** → `<iframe srcdoc sandbox>` **without** `allow-scripts`/`allow-same-origin`; sanitized + CSP | Bespoke static "page-like" layouts (posters, one-pagers) |
| **Generated React** (NEW) | `ReactArtifactSandbox` | **Untrusted but executable** → `<iframe sandbox="allow-scripts">` on a **null origin** (no `allow-same-origin`); in-iframe Babel transform + React UMD; postMessage bridge | Interactive widgets: toggles, tabs, small calculators, animated diagrams |

**Design principle — least privilege per mode:** trusted data → real components; untrusted static →
scriptless iframe; untrusted interactive → scripted iframe that is *origin-isolated* so it cannot touch
the parent DOM, cookies, `localStorage`, or the network.

---

## 4. The new/hard part: safely executing **generated React**

Executing model-authored code is the riskiest capability, so it gets the strictest containment.

### 4.1 Isolation model
- Rendered in an **`<iframe>`** whose document is provided via `srcdoc`.
- `sandbox="allow-scripts"` — scripts run, **but `allow-same-origin` is deliberately omitted**, so the
  iframe is a unique opaque origin: it **cannot** read the parent DOM, cookies, `localStorage`,
  `sessionStorage`, or make same-origin calls. This is the key safety property.
- A strict **CSP** inside the srcdoc: `default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'unsafe-inline'; img-src data: https:;` — no network egress except the pinned CDN for the
  React + Babel UMD bundles (or self-hosted copies under `/vendor/` for zero external deps).
- **No network for the component:** `connect-src 'none'` blocks `fetch`/XHR/websocket from generated code.

### 4.2 Execution pipeline (inside the iframe)
1. Host injects: React + ReactDOM UMD, Babel-standalone, a tiny bootstrap, the generated `code`, and a
   read-only `data` prop (JSON).
2. Bootstrap wraps the code in a **React error boundary**, `Babel.transform(code, { presets: ["react"] })`,
   evaluates it to obtain a `default` component, and `ReactDOM.render(<Component data={data} />)`.
3. A **watchdog timer** (e.g., 2s) aborts if transform/first-render hangs.
4. Height + errors are reported to the host via `postMessage` (origin-checked by opaque token).

### 4.3 Host ↔ iframe bridge (postMessage)
- iframe → host: `{ type:"resize", height }`, `{ type:"error", message }`, `{ type:"ready" }`.
- host → iframe: none required after init (one-way data injection at build time keeps it simple).
- Host validates messages by a per-instance nonce and ignores anything else.

### 4.4 Contract for generated code (what the model must produce)
- A single self-contained component: `export default function Widget({ data }) { … }` using only React
  (hooks allowed) and inline styles / a provided `css` string. **No imports, no fetch, no timers beyond
  a capped count.** The system prompt states this precisely; a validator rejects code containing
  `import`, `require`, `fetch`, `XMLHttpRequest`, `while(true)`, etc. before it ever reaches the iframe.
- On validation failure or runtime error → the block **degrades** to a Markdown explanation + (optional)
  a static component. The page never shows a broken frame.

### 4.5 Why not react-live / Sandpack?
`react-live` executes in the **same origin** (unsafe for untrusted code). Sandpack spins a bundler
(heavy, network). The origin-isolated iframe + Babel-standalone is the minimal, robust, dependency-light
choice and mirrors the sandboxing discipline already used for HTML artifacts.

---

## 5. Agent changes (LangGraph.js)

- **New brain method:** `reactWidget(input): Promise<{ code: string; data?: unknown }>` on the `Brain`
  interface; real impl prompts DeepSeek with the strict component contract, fake impl returns a canned,
  validated counter/tab widget for deterministic tests.
- **Router extends** with a `makeReactWidget` route (keywords/intent: "interactive", "widget", "let me
  toggle/explore", "calculator"). Guardrails unchanged (scope + injection still gate first).
- **New node** `makeReactWidget`: calls `reactWidget`, runs the **static validator**, emits a `react`
  block (or falls back to `answer`). Mirrors `makeArtifact`.
- **Composition (optional, phase 2):** allow the `answer` node to emit multiple blocks (markdown +
  component) in one reply via a lightweight plan. MVP keeps one primary block per reply + prose.

### 5.1 Streaming protocol additions (`events.ts`)
- Add `{ type: "react_artifact"; id; title; code; data }` (code/data base64-encoded on the wire, like html).
- `parseSSE`/`toSSE` extended; everything else (reasoning/content/ui/followups/done) unchanged.
- The page hook folds `react_artifact` into `message.blocks` as a `react` block.

---

## 6. Page UX / information architecture (`/ask`)

**Route:** `app/ask/page.tsx` (client shell `AskPage`), added to `SiteNav` as "Ask".

**States:**
1. **Empty (hero) state** — chatbot-first: big centered prompt "Ask me anything about Trac", the input
   with send, and 4–6 suggestion chips (reuse seeds + a couple that trigger component/HTML/React modes,
   e.g. "Show an interactive skills widget"). Minimal chrome; the input is the focus.
2. **Conversation state** — after first send: a scrollable transcript (user + assistant messages),
   sticky composer at the bottom, a subtle "thinking" reasoning trail per reply, follow-up chips, and a
   "New chat" reset. Auto-scroll with a "scroll to latest" affordance.
3. **Block rendering** — each assistant reply renders its `blocks[]` in order: Markdown inline;
   components and HTML/React artifacts as full-width cards with a small mode label ("Interactive",
   "Generated view") and, for artifacts, a "Open in full" affordance.

**Shared core:** extract a `Conversation` component (transcript + composer + hook) used by BOTH the
floating widget (`AskTrac`) and the full page, so behavior stays consistent. The page is the
"maximized" presentation; the widget is the "minimized" one.

**Design language:** reuse the dark/amber tokens; mono labels; hairline borders; `prefers-reduced-motion`
respected; artifact frames get a faint "sandboxed" chip to signal (and show off) the isolation.

**A11y & mobile:** labelled input, live-region for streaming status, keyboard send (Enter) + newline
(Shift+Enter), focus management, full-height layout on mobile with a docked composer.

---

## 7. Robustness, safety, performance

- **Isolation:** trusted data→components; untrusted static→scriptless iframe; untrusted interactive→
  origin-isolated scripted iframe (§4). No generated mode can reach the parent, cookies, or network.
- **Validation everywhere:** component props via Zod; React code via a static denylist + size cap;
  HTML via DOMPurify + CSP. Any failure degrades gracefully.
- **Streaming resilience:** first `reasoning` event at t≈0 for liveness; per-reply error block; abort/stop
  button cancels the fetch reader; reconnect-safe (stateless server + client message store).
- **Cost/abuse:** existing IP rate limit; per-reply block caps (≤1 artifact, ≤1 react widget); cheap
  default model, React/HTML generation behind the same limiter.
- **Performance:** React/Babel UMD lazy-loaded only when a `react` block exists (self-hosted under
  `/public/vendor` to avoid external CDN dependency and keep CSP tight); iframes are virtualized/lazy
  when off-screen; MarkdownRenderer memoized (already).
- **SSR/SEO:** the page renders a static hero + description server-side; the transcript is client-only.

---

## 8. Reuse map (what exists vs. what's new)

| Exists (reuse) | New (build) |
|---|---|
| `useAskTrac` hook, SSE `parseSSE`, LangGraph graph | `Block` model + fold logic; `react_artifact` event |
| `MarkdownRenderer`, `GenerativeUIRenderer`, `ArtifactSandbox` | `ReactArtifactSandbox` (+ in-iframe bootstrap, validator) |
| `AskTrac` floating widget | `Conversation` shared core; `app/ask/page.tsx` `AskPage`; nav link |
| provider/brain, fake model | `reactWidget` brain method + `makeReactWidget` node + fake canned widget |

---

## 9. Delivery phases & acceptance criteria

**Phase 1 — Dedicated page over existing modes (fast win)**
- `/ask` page with empty→conversation states; shared `Conversation`; nav link; Markdown + components +
  HTML artifacts all render inline. AC: E2E — ask → reasoning → markdown + a component + an artifact
  render on `/ask`; zero console errors; mobile layout works; page is SSR-described.

**Phase 2 — Generated React mode (the flagship)**
- `react` block + `ReactArtifactSandbox` + agent `makeReactWidget` + validator + fake canned widget.
- AC: E2E — "show an interactive skills widget" renders a working React widget inside an
  `allow-scripts`, **non**-`allow-same-origin` iframe; clicking a control in it updates *inside* the frame;
  a deliberately broken snippet degrades to a graceful fallback (no crash, no parent errors); the
  iframe cannot access `document.cookie` (unit-verified via the bootstrap contract).

**Phase 3 — Composition & polish**
- Multi-block replies (prose + component + widget in one answer); "open artifact full-screen"; stop/regenerate;
  transcript persistence in `sessionStorage`.

**Test strategy (per phase):** unit (block fold, validator, event round-trip), component (each renderer +
`ReactArtifactSandbox` sandbox attributes), E2E (Playwright, fake provider → deterministic widgets),
build + typecheck gates — same discipline as the current assistant.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Executing model code (XSS/exfil) | Origin-isolated iframe (no same-origin), strict CSP incl. `connect-src 'none'`, static validator, self-hosted runtime |
| Infinite loops / heavy render | Watchdog timeout, size cap, single component contract |
| Bundle weight (React/Babel UMD) | Lazy-load only when a react block exists; self-host; cache |
| Mode mis-routing by the LLM | Deterministic fake for tests; graceful degrade to Markdown; router few-shot + guard |
| Duplicate UX drift (widget vs page) | Single shared `Conversation` core |
| Cost of code-gen | Rate limit + per-reply caps + cheap default model |

---

*Prepared from the request: a dedicated chatbot-first "Ask About Me" page rendering Markdown,
pre-templated components, generated HTML, and generated React — robustly and safely.*
