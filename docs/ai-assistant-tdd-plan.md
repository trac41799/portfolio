# Ask-Trac Assistant — TDD Implementation Plan

> **For agentic workers:** implement task-by-task, RED → GREEN → REFACTOR, one vertical slice at a
> time. Steps use `- [ ]` checkboxes. Never write all tests up front (no horizontal slicing).

**Goal:** Ship an in-site agentic assistant for the `nguyendangtrac` portfolio that answers
questions about Trac and renders **live, design-system UI** (typed components + sandboxed HTML
artifacts) inline in the chat — verifiably working E2E.

**Architecture:** LangGraph.js state graph (`guard → retrieve → route → answer | renderUI |
makeArtifact | refuse`) runs inside a Next.js Route Handler and streams custom SSE events. A React
chat panel consumes the stream and maps typed tool outputs to real components; open-ended HTML
renders in a locked-down `<iframe srcdoc>`. LLM layer is provider-swappable: **DeepSeek** (primary)
→ **OpenRouter** (fallback) → **deterministic fake** (tests/E2E, no key).

**Tech Stack:** TypeScript · Next.js 15 (App Router, Node runtime) · `@langchain/langgraph` +
`@langchain/openai` + `@langchain/core` · Zod · Vitest + React Testing Library · Playwright.

---

## Definition of Done (global acceptance criteria)

- **G1** `npm run typecheck` (tsc `--noEmit`) passes.
- **G2** `npm run test` (Vitest unit + component) passes; ≥ 90% of assistant lib lines covered.
- **G3** `npm run test:e2e` (Playwright, `LLM_PROVIDER=fake`) passes.
- **G4** `npm run build` (Next.js production build) succeeds.
- **G5** Manual/E2E: opening the site, clicking **Ask about Trac**, and sending each seeded prompt
  renders — with **no console errors** and **no unhandled promise rejections**:
  - a factual answer with a reasoning trail,
  - a typed component (timeline / comparison / project card),
  - a sandboxed HTML artifact,
  - clickable follow-up chips.
- **G6** With a real key set, a smoke request returns a grounded answer; with **no** key, the fake
  provider still produces a coherent, rendered response (graceful, never broken).
- **G7** No secret is committed; `.env.local` stays gitignored; artifacts cannot execute JS.

---

## Shared contracts (source of truth — build these FIRST, freeze before parallel work)

### C1 — `lib/assistant/contracts.ts` (typed generative UI)

Discriminated union validated by Zod. The agent may only emit these; the frontend only renders these.

```ts
import { z } from "zod";

export const timeline = z.object({ items: z.array(z.object({
  date: z.string(), title: z.string(), detail: z.string().optional() })).min(1) });

export const comparison = z.object({
  columns: z.array(z.string()).min(2),
  rows: z.array(z.object({ label: z.string(), values: z.array(z.string()) })).min(1) });

export const projectCard = z.object({
  slug: z.string(), title: z.string(), stack: z.array(z.string()),
  highlights: z.array(z.string()).min(1), signal: z.string().optional() });

export const metricGrid = z.object({ metrics: z.array(z.object({
  value: z.string(), label: z.string() })).min(1) });

export const skillMatrix = z.object({ groups: z.array(z.object({
  name: z.string(), items: z.array(z.string()) })).min(1) });

export const publicationList = z.object({ pubs: z.array(z.object({
  citation: z.string(), venue: z.string(), year: z.string(),
  note: z.string(), href: z.string().optional() })).min(1) });

export const contactCard = z.object({ email: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.string() })) });

export const uiComponentSchema = z.discriminatedUnion("component", [
  z.object({ component: z.literal("timeline"), props: timeline }),
  z.object({ component: z.literal("comparison"), props: comparison }),
  z.object({ component: z.literal("projectCard"), props: projectCard }),
  z.object({ component: z.literal("metricGrid"), props: metricGrid }),
  z.object({ component: z.literal("skillMatrix"), props: skillMatrix }),
  z.object({ component: z.literal("publicationList"), props: publicationList }),
  z.object({ component: z.literal("contactCard"), props: contactCard }),
]);
export type UIComponent = z.infer<typeof uiComponentSchema>;
export const UI_COMPONENT_NAMES = ["timeline","comparison","projectCard","metricGrid","skillMatrix","publicationList","contactCard"] as const;
```

### C2 — `lib/assistant/events.ts` (streaming protocol)

```ts
import type { UIComponent } from "./contracts";

export type AssistantEvent =
  | { type: "reasoning"; step: string }
  | { type: "content"; text: string }
  | { type: "ui"; component: UIComponent }
  | { type: "artifact"; id: string; title: string; html: string }
  | { type: "artifact_replaced"; id: string; html: string }
  | { type: "followups"; questions: string[] }
  | { type: "error"; message: string }
  | { type: "done" };

// base64-encode free-text/html fields (HTML-safe transport, mirrors the LMS event bus)
export function toSSE(e: AssistantEvent): string;      // returns "event: <type>\ndata: <json>\n\n"
export function parseSSE(chunk: string): AssistantEvent[]; // client-side decoder
```

**Rule:** `content.text` and `artifact.html`/`artifact_replaced.html` are base64 in the wire JSON;
`toSSE`/`parseSSE` handle encode/decode so callers use plain strings.

### C3 — Model provider interface — `lib/assistant/provider.ts`

```ts
export type Provider = "deepseek" | "openrouter" | "fake";
export interface ChatModelLike {
  // returns a plain-text completion for a prompt (used by route/answer/artifact nodes)
  complete(input: { system: string; user: string; json?: boolean }): Promise<string>;
}
export function resolveProvider(env: NodeJS.ProcessEnv): Provider; // auto: deepseek→openrouter→fake
export function getModel(p: Provider): ChatModelLike; // deepseek/openrouter via ChatOpenAI baseURL
```

### C4 — Corpus + retriever

`lib/assistant/corpus/` holds `bio.md`, `faq.md`, and `facts.json`; projects/publications/metrics
are imported from the existing `lib/data.ts`. `retriever.ts` exposes:

```ts
export interface Doc { id: string; text: string; source: string }
export function buildCorpus(): Doc[];
export function retrieve(query: string, k?: number): Doc[]; // lexical BM25-lite, deterministic
```

**Freeze gate:** C1–C4 reviewed and committed before backend/frontend agents run in parallel.

---

## Milestone M0 — Tooling & scaffold

### Task 0.1 — Dependencies & scripts
**Files:** `package.json`
- [ ] Add deps: `@langchain/langgraph`, `@langchain/core`, `@langchain/openai`, `zod`.
- [ ] Add devDeps: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`.
- [ ] Add scripts: `test`, `test:e2e`, `typecheck`, `test:coverage`.
- [ ] **AC:** `npm install` succeeds; `npx vitest --version` and `npx playwright --version` resolve.

### Task 0.2 — Test config
**Files:** `vitest.config.ts`, `playwright.config.ts`, `vitest.setup.ts`
- [ ] Vitest: `environment: "jsdom"`, setup imports `@testing-library/jest-dom`, alias `@/`.
- [ ] Playwright: `webServer` runs `next dev` with `LLM_PROVIDER=fake`, baseURL `localhost:3000`.
- [ ] **AC:** `npm run test` runs with 0 tests found (green); `npm run test:e2e` boots the server.

---

## Milestone M1 — Contracts (tracer bullet through the protocol)

### Task 1.1 — UI schema validation
**Files:** `lib/assistant/contracts.ts`, `lib/assistant/contracts.test.ts`
- [ ] **RED:** test — a valid `timeline` object parses; an invalid one (empty `items`) throws.
- [ ] **GREEN:** implement C1.
- [ ] **AC:** every component name in `UI_COMPONENT_NAMES` has a schema; round-trips valid fixtures.

### Task 1.2 — SSE encode/decode round-trip
**Files:** `lib/assistant/events.ts`, `lib/assistant/events.test.ts`
- [ ] **RED:** `parseSSE(toSSE(e))` deep-equals `e` for one event of every `type`, including
  content with newlines/emoji and HTML with `<>&"` chars.
- [ ] **GREEN:** implement C2 with base64 for text/html fields.
- [ ] **AC:** malformed chunk → `parseSSE` returns `[]` (never throws).

---

## Milestone M2 — Backend (LangGraph.js) — parallelizable Agent A

> Verify LangGraph.js API via docs before coding (custom event streaming, `StateGraph`, conditional
> edges). Use `dispatchCustomEvent` + `graph.streamEvents({version:"v2"})` for streaming.

### Task 2.1 — Retriever
**Files:** `lib/assistant/corpus/*`, `lib/assistant/retriever.ts`, `retriever.test.ts`
- [ ] **RED:** `retrieve("publications")` returns a doc whose `source` mentions IEEE; `retrieve("")` returns `[]`.
- [ ] **GREEN:** author corpus files + BM25-lite scorer.
- [ ] **AC:** deterministic ordering; top result for "Edge8" is the Edge8 experience doc.

### Task 2.2 — Fake model (deterministic brain for tests/E2E)
**Files:** `lib/assistant/fake-model.ts`, `fake-model.test.ts`
- [ ] **RED:** `complete()` for a "compare … projects" prompt returns a JSON decision `{route:"renderUI", component:"comparison"}`; a "one-page summary" prompt → `{route:"makeArtifact"}`; a plain factual prompt → `{route:"answer"}`; an off-topic prompt → `{route:"refuse"}`.
- [ ] **GREEN:** keyword-driven deterministic responder that also returns valid props/HTML on demand.
- [ ] **AC:** all `renderUI` props emitted by the fake validate against `uiComponentSchema`.

### Task 2.3 — Real provider adapter
**Files:** `lib/assistant/provider.ts`, `provider.test.ts`
- [ ] **RED:** `resolveProvider({DEEPSEEK_API_KEY:"x"})==="deepseek"`; `({OPENROUTER_API_KEY:"x"})==="openrouter"`; `({})==="fake"`; `({LLM_PROVIDER:"fake",DEEPSEEK_API_KEY:"x"})==="fake"`.
- [ ] **GREEN:** implement resolution + `getModel` (DeepSeek/OpenRouter via `ChatOpenAI` with `configuration.baseURL`; `.withFallbacks`).
- [ ] **AC:** no network call happens for `fake`; provider errors surface as `{type:"error"}` upstream, never crash the route.

### Task 2.4 — Graph nodes + assembly
**Files:** `lib/assistant/graph.ts`, `lib/assistant/runAssistant.ts`, `graph.test.ts`
- [ ] **RED (tracer):** `collect(runAssistant({query:"What did he build at Edge8?", provider:"fake"}))` yields, in order, ≥1 `reasoning`, then `content`, then `followups`, then `done`.
- [ ] **GREEN:** build `StateGraph`; nodes `guard, retrieve, route, answer, renderUI, makeArtifact, refuse`; wire conditional edges on `route`.
- [ ] **RED:** "compare the LMS and Travel Buddy projects" yields a `ui` event with `component==="comparison"` and schema-valid props.
- [ ] **RED:** "design a one-page summary" yields an `artifact` event with non-empty sanitized html.
- [ ] **RED:** "what's the weather" (off-topic) yields a `content` refusal and **no** `ui`/`artifact`.
- [ ] **AC per node:** `guard` blocks off-topic/injection; `retrieve` populates state; every `ui` payload validates; `answer` content is non-empty and grounded (mentions a retrieved fact).
- [ ] **AC:** `runAssistant` never throws; internal errors become a single `{type:"error"}` + `done`.

### Task 2.5 — Artifact sanitization
**Files:** `lib/assistant/sanitize.ts`, `sanitize.test.ts`
- [ ] **RED:** `sanitizeArtifact("<script>alert(1)</script><div>ok</div>")` strips `<script>` and any `on*` handler, keeps `<div>ok</div>`; wraps output with the design-token `<style>` + CSP meta.
- [ ] **GREEN:** allowlist sanitizer + token wrapper.
- [ ] **AC:** output contains no `<script`, no `on\w+=`, no `javascript:`; size-capped at 32 KB.

---

## Milestone M3 — Frontend (React) — parallelizable Agent B

### Task 3.1 — Generative-UI components (one test each, vertical)
**Files:** `components/assistant/ui/*.tsx`, `components/assistant/ui/*.test.tsx`
- [ ] For **each** of timeline, comparison, projectCard, metricGrid, skillMatrix, publicationList,
  contactCard: **RED** render with a fixture → assert key text is in the document; **GREEN** build
  the component using existing design tokens; **AC:** no `any`, props typed from `contracts.ts`.

### Task 3.2 — GenerativeUIRenderer (registry)
**Files:** `components/assistant/generative-ui.tsx`, `generative-ui.test.tsx`
- [ ] **RED:** given `{component:"timeline", props}` renders `<Timeline>`; an unknown component name
  renders a graceful fallback (not a crash).
- [ ] **GREEN:** map `component → React component`; validate props with `uiComponentSchema` before render.
- [ ] **AC:** invalid props render fallback + dev warning, never throw.

### Task 3.3 — ArtifactSandbox
**Files:** `components/assistant/artifact-sandbox.tsx`, `artifact-sandbox.test.tsx`
- [ ] **RED:** renders an `<iframe>` with `srcdoc` set and `sandbox` attribute that excludes
  `allow-scripts` and `allow-same-origin`.
- [ ] **GREEN:** implement; show skeleton until html present; swap on `artifact_replaced`.
- [ ] **AC:** `sandbox` never contains `allow-scripts`.

### Task 3.4 — SSE client hook
**Files:** `components/assistant/use-ask-trac.ts`, `use-ask-trac.test.ts`
- [ ] **RED:** feeding a mocked SSE `ReadableStream` of `reasoning→content→ui→followups→done`
  produces a message whose parts are `{reasoning[], content, ui[], followups}` in order; `isStreaming`
  flips false on `done`.
- [ ] **GREEN:** `fetch('/api/chat')` reader loop using `parseSSE`.
- [ ] **AC:** network error → sets an error part, `isStreaming=false`; no unhandled rejection.

### Task 3.5 — Chat panel + launcher
**Files:** `components/assistant/ask-trac.tsx`, `message-list.tsx`, mount in `app/layout.tsx`
- [ ] **RED:** launcher button has accessible name "Ask about Trac"; clicking opens a dialog with
  role `dialog` and seeded suggestion chips.
- [ ] **GREEN:** build panel (reasoning trail, message list, input, suggestions) with the site theme.
- [ ] **AC:** keyboard accessible (focus trap, Esc closes); respects `prefers-reduced-motion`.

---

## Milestone M4 — Integration (owner: main session, after M2+M3)

### Task 4.1 — Route Handler
**Files:** `app/api/chat/route.ts`, `route.test.ts`
- [ ] **RED:** POST `{messages:[{role:"user",content:"hi"}]}` with `LLM_PROVIDER=fake` returns
  `Content-Type: text/event-stream` and a body containing an `event: done` line.
- [ ] **GREEN:** `export const runtime = "nodejs"`; stream `toSSE` from `runAssistant`; in-memory
  rate limit (e.g., 20 msg / 5 min / IP) → `{type:"error"}` when exceeded.
- [ ] **AC:** provider resolved server-side; no key leaks to client; rate-limit path tested.

### Task 4.2 — Wire hook → panel → renderer end to end (component integration)
- [ ] **AC:** a jsdom integration test drives `AskTrac` against a mocked route and asserts a
  `comparison` component appears in the panel.

---

## Milestone M5 — E2E gate (owner: main session)

### Task 5.1 — Playwright specs (`e2e/ask-trac.spec.ts`)
- [ ] **AC-E1:** open site → click "Ask about Trac" → dialog visible.
- [ ] **AC-E2:** send "What did he build at Edge8?" → reasoning step shows → answer text appears.
- [ ] **AC-E3:** send "Compare the LMS and Travel Buddy projects" → a comparison table renders.
- [ ] **AC-E4:** send "Design a one-page recruiter summary" → an artifact `<iframe>` renders.
- [ ] **AC-E5:** click a follow-up chip → a new answer streams.
- [ ] **AC-E6:** **zero** console errors and **zero** page errors across the whole run
  (`page.on('console'|'pageerror')` asserted empty).
- [ ] **GREEN:** fix any broken piece until all pass.

### Task 5.2 — Full gate + build
- [ ] Run `npm run typecheck && npm run test && npm run test:e2e && npm run build` → all green (G1–G4).

---

## Milestone M6 — Ship
- [ ] Commit in small vertical increments throughout (per task).
- [ ] `vercel env add DEEPSEEK_API_KEY / OPENROUTER_API_KEY / LLM_PROVIDER` (production).
- [ ] Push → Vercel auto-deploy → verify `/` loads and the assistant answers live (G6).

---

## Multi-agent execution mapping

| Wave | Agent | Scope | Depends on |
|---|---|---|---|
| 0 | main | M0 tooling + **C1–C4 contracts** (freeze) | — |
| 1 | **Agent A** | M2 backend (retriever, fake model, provider, graph, sanitize) + unit tests | contracts frozen |
| 1 | **Agent B** | M3 frontend (UI components, renderer, sandbox, hook, panel) + component tests | contracts frozen |
| 2 | main | M4 integration (route handler, wiring) | A + B merged |
| 3 | main | M5 E2E loop until green, then M6 ship | M4 |

**Contract discipline:** Agents A and B import the *same* `contracts.ts`/`events.ts`. Neither edits
them. Any contract gap is escalated to the main session, fixed once, and both agents re-sync.

---

## Risks & mitigations (implementation-specific)
- **LangGraph.js API drift** → verify against current docs before Task 2.4; keep node fns pure so the
  graph wrapper is thin and swappable.
- **Playwright browser download blocked** → `npx playwright install chromium` up front; if blocked,
  fall back to the jsdom integration test (Task 4.2) as the E2E gate and document it.
- **Fake vs real divergence** → the fake emits the *same* schema-valid shapes the real model is
  prompted for, so the render path is identical regardless of provider.
- **Streaming inside Route Handlers** → use a `ReadableStream` with an async pump; emit a first
  `reasoning` event immediately so the client shows liveness (LMS t=0 principle).
