# System Design — "Ask Trac" Generative-UI Portfolio Assistant

> **Status:** Design proposal · **Author:** grounded in the `aio-lab-be` production architecture
> **Target app:** `nguyendangtrac` portfolio (Next.js 15 · Tailwind v4 · Vercel)
> **One-line pitch:** A recruiter/visitor can chat with an agent about my background, and instead of
> plain Markdown it streams **live, design-system-styled UI** (timelines, project cards, comparison
> tables, sandboxed HTML one-pagers) directly inside the conversation — a safer, framework-based
> evolution of the artifact-generation feature I shipped in a production LMS.

---

## 0. TL;DR for the impatient

- **Build it.** It converts the portfolio from a static brochure into a *live demo of my most
  differentiated skill* (generative-UI artifacts). The medium becomes the message.
- **Framework: LangGraph (Python)** as the orchestration core, with **LangChain retrievers** for RAG,
  **Vercel AI SDK** on the frontend for generative UI + streaming, and **LangSmith** for tracing.
  Rationale in §4 — chosen specifically to close the "no framework experience" gap while mapping
  1:1 onto the from-scratch system I already built.
- **Centerpiece:** a two-tier generative-UI system — (1) a **typed React component registry** the
  agent calls as tools (safe, branded, deterministic) and (2) a **sandboxed HTML artifact** escape
  hatch for open-ended "page-like" generation (the wow factor), hardened with iframe sandboxing +
  CSP + sanitization.
- **Scope guardrails:** the agent only answers about me; rate-limited, cost-capped, model-fallback,
  fully observable.

---

## 1. Why this idea fits the portfolio (strategic fit)

### 1.1 The medium is the proof
My CV claims "from-scratch multi-agent systems, streaming AI UX, and inline artifact generation."
A recruiter reading that has to *trust* it. If the portfolio itself is an agentic app that streams
generative UI, the claim becomes **self-evident** — they experience the skill instead of reading a
bullet about it. This is the single highest-leverage thing the site can do.

### 1.2 It showcases the *rarest* skill, not the common one
Anyone can wire `useChat` + `ReactMarkdown`. Far fewer engineers have built **server-driven,
inline, page-like UI generation** with a safety model. That is exactly the contribution I owned in
the LMS (`aio-lab-be`'s artifact system). Leading with it differentiates immediately.

### 1.3 It directly answers the framework-experience objection
Today my strongest agent work is raw Python (powerful, but reads as "no LangGraph/LangChain on the
CV"). Rebuilding a *scoped* version of that system in **LangGraph** — and documenting the mapping
(§13) — lets me legitimately claim modern framework fluency, backed by a live artifact.

### 1.4 Brand cohesion, not bolt-on gimmick
- Reuses the existing dark / warm-amber design tokens, so generated UI looks native to the site.
- Ties answers back to real routes (`/work#ai-lms`, `/about`) instead of dead-ending in chat.
- A visible **"Under the hood"** disclosure explains the architecture — turning the feature into a
  second, meta-level portfolio piece.

### 1.5 Non-goals (what this deliberately is *not*)
- Not a general-purpose chatbot. It refuses off-topic requests and redirects to my background.
- Not a RAG-over-the-whole-internet system. The corpus is my own curated material.
- Not a place to expose private data (phone number, client names) — see §11.

---

## 2. Goals & measurable outcomes

| Goal | Success signal |
|---|---|
| Prove the generative-UI skill live | Visitor sees ≥1 rendered artifact in a typical session |
| Demonstrate framework fluency | Codebase is idiomatic LangGraph + LangChain + Vercel AI SDK |
| Stay fast | Time-to-first-token < 800 ms; first artifact < 3 s |
| Stay cheap & safe | Hard per-session token cap; rate limited; scoped to my background |
| Be recruiter-legible | "Under the hood" page + public repo with this design doc |
| Be honest | Answers are grounded in retrieved facts; refuses when unknown |

---

## 3. Grounding — what I already built, and how this evolves it

The LMS backend (`aio-lab-be`) established the patterns this design reuses. Key mechanisms
(verbatim from its architecture docs):

- **Adaptive orchestrator** over a single `AgentState` ledger; **declarative routing**
  (`RouterOutput { intent, status, tools_group }`); a **Chameleon tool agent** that merges tool
  planning + execution in one role-shaped LLM call; a thin, streaming **AnsweringAgent**.
- **Stream-tag stripper** — a `STREAMING → SCANNING → INSIDE_TAG` state machine that intercepts
  control tags (`<step_complete/>`, `<artifact_spec>`) mid-stream so raw XML never reaches the client.
- **Two-stage artifact generation** — the fast coach LLM emits an *artifact spec* (a description),
  a dispatcher hands it to a higher-capability **enhancer LLM** that calls a structured
  `create_artifact` tool to produce **design-system-aligned HTML**, rendered in a **sandboxed
  `<iframe srcdoc>`**.
- **Progressive enhancement** — raw artifact delivered instantly, then swapped via an
  `artifact_replaced` SSE event once the premium model finishes (seamless React re-render).
- **Fence taxonomy** — ` ```html-artifact `/` ```mermaid-artifact `/` ```chart ` → panel;
  ` ```html-inline ` → inline sandboxed iframe; plain ` ```html ` → not extracted.
- **Streaming-first, base64-encoded SSE** events: `content`, `reasoning`, `metadata`, `artifact`,
  `artifact_replaced`, `followUpQuestions`, `timing`, `error`.
- **Speed + robustness**: fast-path gates before any LLM call, parallel init-turn I/O, circuit
  breaker, hallucination guard, timeout-guarded post-response work, non-blocking session writes.

**What changes for the portfolio version (deliberate upgrades):**

| LMS (aio-lab-be) | Portfolio assistant | Why the change |
|---|---|---|
| Raw Python orchestrator, hand-rolled loop | **LangGraph** state graph | Close the framework-experience gap; get checkpointing/HITL/streaming for free |
| Artifact = LLM-authored **raw HTML string** | **Typed component registry** first, HTML artifact as escape hatch | Safer, on-brand, deterministic; HTML kept for open-ended cases |
| Multi-tenant, grading, Circle/Lark connectors | **Single-tenant, read-only "about me" domain** | Scope down hard — this is a demo, not a SaaS |
| Custom OpenRouter client | Keep OpenRouter for **model fallback**, wrapped as a LangChain `ChatModel` | Reuse a real strength; stay provider-agnostic |

---

## 4. Framework decision — LangGraph (with clean rationale)

### 4.1 Decision
**Orchestration core: LangGraph (Python).**
**Retrieval: LangChain** retrievers + a vector store (pgvector on Supabase).
**Frontend rendering + streaming transport: Vercel AI SDK (v5) in Next.js.**
**Observability: LangSmith.**
**Model gateway: OpenRouter** wrapped as a chat model (multi-provider fallback).

### 4.2 Why a framework at all (given I can build it from scratch)
The from-scratch system is a genuine strength, but for *this* artifact the explicit objective is to
**demonstrate the tools employers filter on**. Using LangGraph is a résumé decision as much as an
engineering one — and it's honest, because LangGraph formalizes the exact patterns I already
implemented by hand (see the mapping in §13).

### 4.3 Options considered

| Option | What it is | Fit here | Verdict |
|---|---|---|---|
| **LangGraph** | Graph/state-machine runtime for controllable, streaming, stateful agents | Maps 1:1 to my router→planner→executor design; native token/step streaming; `interrupt` for HITL; `PostgresSaver` checkpointer; tight LangSmith tracing | **Chosen — core** |
| **LangChain (core)** | Component library: loaders, retrievers, embeddings, chains | Excellent for the RAG *pieces*, weak as an orchestrator on its own | **Adopt for retrieval only**, inside LangGraph |
| **CrewAI** | Role-based autonomous multi-agent crews | Higher abstraction, less deterministic control; overkill for a scoped single-purpose Q&A + UI bot; less production-demanded than LangGraph | Rejected (would hide, not show, control) |
| **LlamaIndex** | Retrieval/index framework (I used it in Travel Buddy) | Great retrievers, but orchestration + generative-UI is the star; would duplicate LangChain's role | Rejected to avoid stack sprawl (already on my CV) |
| **Vercel AI SDK only (TS)** | Streaming + generative UI in Next.js | Best-in-class for the *frontend* generative-UI half; but it is **not** a Python agent framework and doesn't address the LangGraph gap | **Adopt for the frontend**, not the orchestrator |
| **Pure from-scratch (status quo)** | My current approach | Powerful, but repeats the exact CV weakness this project exists to fix | Rejected for this artifact |

### 4.4 Why LangGraph over the nearest alternative (CrewAI)
- **Determinism & control:** explicit nodes/edges + typed state = predictable, testable flows. A
  recruiter-facing bot must be reliable and cheap; autonomous crews trade control for autonomy I
  don't want here.
- **Streaming is first-class:** `stream_mode="messages"` / `updates` gives token and node-level
  streaming that maps cleanly onto the SSE/`reasoning` UX I already designed.
- **Durable memory:** checkpointers (`MemorySaver` for anonymous sessions, `PostgresSaver` on
  Supabase for persistence) replace my hand-rolled `SessionManager`.
- **HITL & guards:** built-in `interrupt`/breakpoints formalize my circuit-breaker/hallucination-guard.
- **Observability:** LangSmith gives traces, token/cost accounting, and eval harnesses — another
  employable tool demonstrated.
- **Market signal:** LangGraph is the most in-demand *production* agent framework in job specs.

### 4.5 The honest framing (turns a weakness into a story)
> "I built this class of system from first principles in production (custom router/planner/executor,
> stream-tag interception, two-stage artifact generation). Here I re-expressed it in LangGraph to
> show the same architecture in the industry-standard framework." — §13 is the receipt.

---

## 5. High-level architecture

```
                              ┌──────────────────────────────────────────────┐
        Browser               │        Next.js (Vercel) — nguyendangtrac      │
  ┌───────────────┐  chat UI  │                                              │
  │ Ask-Trac panel│◀─────────▶│  useChat (Vercel AI SDK)                     │
  │  - messages   │           │  ├─ GenerativeUIRenderer (typed components)  │
  │  - artifacts  │           │  ├─ ArtifactSandbox (<iframe srcdoc>)        │
  │  - reasoning  │           │  └─ /api/chat  (Route Handler, proxy+stream) │
  └───────────────┘           └───────────────┬──────────────────────────────┘
                                               │ SSE / AI SDK data-stream (base64 HTML-safe)
                                               ▼
                              ┌──────────────────────────────────────────────┐
                              │     FastAPI + LangGraph service (Python)      │
                              │                                              │
                              │  StateGraph(AssistantState):                 │
                              │    guard ─▶ retrieve ─▶ route ─▶ answer       │
                              │                   │        │                 │
                              │                   │        ├─▶ render_ui tool │ (typed component)
                              │                   │        └─▶ make_artifact  │ (HTML enhancer)
                              │                   ▼                          │
                              │            LangChain hybrid retriever         │
                              │  Checkpointer (MemorySaver / PostgresSaver)   │
                              └───────┬───────────────┬───────────────┬───────┘
                                      │               │               │
                              ┌───────▼───┐   ┌────────▼──────┐  ┌─────▼──────┐
                              │ pgvector  │   │  OpenRouter    │  │ LangSmith  │
                              │ (Supabase)│   │  (multi-model  │  │ (tracing)  │
                              │  + BM25   │   │   + fallback)  │  │            │
                              └───────────┘   └───────────────┘  └────────────┘
                                      ▲
                              ┌───────┴────────┐
                              │ Upstash Redis  │  rate limit + semantic cache
                              └────────────────┘
```

---

## 6. Component design

### 6.1 Frontend (Next.js + Vercel AI SDK)
- **Launcher + panel.** A floating "Ask about Trac" button opens a chat panel (or a dedicated
  `/ask` route). Seeded with suggested prompts: *"What did he build at Edge8?"*, *"Show his
  publications"*, *"Compare the LMS and Travel Buddy projects"*, *"Design me a one-page summary."*
- **Transport.** `useChat` against a Next.js Route Handler `/api/chat` that **proxies** to the
  Python service and forwards the stream. Keeping a thin BFF on Vercel hides the backend URL, adds
  the rate-limit check at the edge, and lets the browser talk same-origin.
- **`GenerativeUIRenderer`.** Maps tool-call parts from the stream to real React components in the
  site's design system (§7). This is the primary, safe rendering path.
- **`ArtifactSandbox`.** Renders open-ended HTML artifacts inside a locked-down `<iframe srcdoc>`
  (§9). Shows a skeleton, then swaps to the enhanced version on `artifact_replaced`.
- **Reasoning + follow-ups.** Collapsible "thinking" trail (from `reasoning` events) and clickable
  follow-up chips — reusing the exact UX vocabulary from the LMS.

### 6.2 Backend (FastAPI + LangGraph)
**State** (typed, the single ledger — the LangGraph analogue of `AgentState`):

```python
class AssistantState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # chat history
    query: str                                           # current user turn
    retrieved: list[Document]                            # RAG hits for this turn
    route: Literal["answer", "render_ui", "make_artifact", "refuse"]
    ui_intent: dict | None                               # component name + props
    artifact_spec: dict | None                           # {title, description, kind}
    citations: list[str]                                 # source doc ids
    session_id: str
```

**Graph nodes / edges:**

```
START
  └─▶ guard            # scope + prompt-injection + rate-limit verdict
        ├─(refuse)────▶ refuse ─▶ END
        └─(ok)────────▶ retrieve      # hybrid RAG over the "about me" corpus
                          └─▶ route    # LLM picks: answer | render_ui | make_artifact
                                ├─▶ answer         (stream prose + citations) ─▶ suggest ─▶ END
                                ├─▶ render_ui      (emit typed component tool call) ─▶ answer
                                └─▶ make_artifact  (enhancer LLM → HTML) ─▶ answer
```

- `guard` — cheap classifier + rules: is this about Trac? injection attempt? within budget? On
  fail, routes to a polite `refuse`. (This is the hallucination-guard/scope-gate, formalized.)
- `retrieve` — LangChain **EnsembleRetriever** (dense pgvector + sparse BM25), top-k over the
  curated corpus (§10). Small corpus ⇒ can also fall back to full-context injection.
- `route` — a small, fast model emits a structured decision (mirrors `RouterOutput`). "Show me…",
  "compare…", "timeline of…" → `render_ui`/`make_artifact`; factual Q → `answer`.
- `answer` — streams grounded prose with inline citations; may *also* have emitted a UI tool call.
- `make_artifact` — the two-stage path: spec → **enhancer model** → sanitized HTML → panel, then
  async **progressive enhancement** swap.

**Streaming.** LangGraph `astream_events` → adapter → **AI SDK Data Stream Protocol** (or raw SSE),
reusing the base64 HTML-safe envelope and the event vocabulary from §3.

**Memory.** `MemorySaver` keyed by an anonymous `session_id` cookie for ephemeral chats; optional
`PostgresSaver` (Supabase) if I want durable transcripts for analytics.

### 6.3 Model routing (reusing a real strength)
- **Default (route/guard/answer):** a cheap, fast model (e.g., Gemini Flash / GPT-class mini /
  Claude Haiku) via OpenRouter.
- **Enhancer (HTML artifacts only):** a stronger model (e.g., Claude Sonnet-class) — expensive but
  rare, exactly the LMS split.
- **Fallback:** OpenRouter provider fallback + a local retry policy, wrapped as a LangChain
  `Runnable` with `.with_fallbacks([...])`.

---

## 7. Generative-UI protocol — the centerpiece (Tier 1: typed components)

The agent renders UI by **calling tools whose names are components** in the site's design system.
The frontend never trusts free-form HTML for these; it renders the known component with validated
props. This is the safe, on-brand, deterministic path and covers ~80% of questions.

**Registry (initial set):**

| Tool (component) | Props (validated by Zod/Pydantic) | Used for |
|---|---|---|
| `renderTimeline` | `{ items: {date, title, detail}[] }` | Career / education journey |
| `renderProjectCard` | `{ slug, title, stack[], highlights[], signal }` | A single project deep-dive |
| `renderMetricGrid` | `{ metrics: {value, label}[] }` | "By the numbers" |
| `renderSkillMatrix` | `{ groups: {name, items[]}[] }` | Toolkit / skills |
| `renderPublicationList`| `{ pubs: {citation, venue, year, note, href}[] }` | Research |
| `renderComparison` | `{ columns[], rows[] }` | "Compare X vs Y project" |
| `renderContactCard` | `{ email, links[] }` | "How do I reach him?" |

**Contract.** Each tool has a JSON schema (Pydantic on the backend, mirrored Zod on the frontend).
The `route`/`answer` nodes decide *whether* to call one and with *what props* (drawn only from
retrieved facts — props are data, not prose, so they're hard to hallucinate wildly). The frontend
maps `toolName → <Component {...props} />`, reusing existing design tokens.

**Why typed-first (vs the LMS's raw-HTML-first):** eliminates the XSS surface for the common path,
guarantees brand consistency, is cache-friendly, and is trivially testable (snapshot each component
against fixture props — exactly the regression-suite discipline from my health-tech work).

---

## 8. A turn, end to end (sequence)

```
Visitor: "Compare the LMS and Travel Buddy projects."
  1. FE useChat POST /api/chat  ──▶ Route Handler checks Upstash rate limit ──▶ proxy to FastAPI
  2. guard:      about Trac? yes. injection? no. budget ok? yes.            → emit reasoning "Understanding"
  3. retrieve:   hybrid search → 6 chunks (LMS + Travel Buddy write-ups)    → emit reasoning "Reading his work"
  4. route:      structured decision → render_ui: renderComparison          → emit reasoning "Building a comparison"
  5. answer:     stream prose ("Both are multi-tenant, but…") + tool call renderComparison(props)
  6. FE:         GenerativeUIRenderer mounts <ComparisonTable/> with validated props (branded)
  7. suggest:    followUpQuestions ["Show the LMS architecture", "What was the hardest part?"]
  8. post-turn:  LangSmith trace flushed; session checkpoint saved (non-blocking)
```

For an open-ended prompt ("Design me a one-page recruiter summary"), step 4 routes to
`make_artifact`: enhancer model produces sanitized HTML → `ArtifactSandbox` shows it instantly →
`artifact_replaced` swaps in the polished version ~1–3 s later.

---

## 9. The HTML artifact escape hatch (Tier 2) — security model

For layouts the component registry can't express, the agent emits an `html-artifact`. This is the
"page-like generation" wow factor, and it is the highest-risk surface, so it is contained by
defense-in-depth:

1. **Sandboxed iframe.** `<iframe srcdoc={html} sandbox="allow-popups"` — **no** `allow-scripts`,
   **no** `allow-same-origin`. Generated markup is presentational only; it cannot run JS, read
   cookies, or touch the parent DOM.
2. **Content Security Policy.** The `srcdoc` document carries a strict CSP meta:
   `default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src https:`.
3. **Sanitization.** HTML is run through a sanitizer (DOMPurify client-side, and/or `bleach`/`nh3`
   server-side) with an allowlist of tags/attributes; `<script>`, event handlers, and external
   `href` schemes are stripped.
4. **Design-token injection.** The sandbox document is prepended with the site's CSS variables so
   artifacts inherit the dark/amber theme without the model needing to know hex codes.
5. **Budgets.** Max HTML size (e.g., 32 KB), generation timeout, and a token cap. Over budget →
   graceful fallback to a Tier-1 component or a plain answer (`artifact_error`, non-blocking).
6. **Enhancer isolation.** The expensive model is only reachable via this node, behind the
   rate-limiter and per-session artifact quota.

> This is a *stricter* version of the LMS's `<iframe srcdoc>` approach — same UX, tighter sandbox,
> and a typed-component fast path in front of it so raw HTML is the exception, not the default.

---

## 10. Knowledge base (RAG corpus)

**Sources (all mine, all public-safe):**
- The CV (`NguyenDangTrac_CV_Modern.tex` content), the anonymized `Project_Portfolio_2025-2026.md`,
  publication metadata, and a hand-written `bio.md` / FAQ ("Why did you move from embedded to AI?").
- Structured `facts.json` — a small knowledge graph of roles, dates, stacks, metrics — used to
  populate typed-component props deterministically.

**Pipeline:** chunk (~800 tokens, 150 overlap) → embed → store in **pgvector (Supabase)**; build a
BM25 index for sparse retrieval; combine with a LangChain `EnsembleRetriever`. Because the corpus is
small, retrieval is cheap and can be re-indexed on every deploy from the repo.

**Grounding rule:** the `answer` node must cite retrieved chunk ids; if nothing relevant is
retrieved and the question is about me, it says so rather than inventing (the hallucination guard).

---

## 11. Security, safety & privacy

- **Scope lock.** System prompt + `guard` node constrain the agent to my professional background;
  off-topic/jailbreak attempts get a polite redirect.
- **Prompt-injection defense.** Retrieved documents are treated as data, not instructions; the
  guard screens the user turn; tool props are schema-validated.
- **PII.** Email is public (already on the site); **phone number is excluded** from the corpus.
  No client names beyond what's already public in my portfolio doc.
- **No secrets client-side.** All model/API keys live only in the Python service / server env.
- **Artifact containment.** See §9.
- **Abuse & cost.** Upstash Redis sliding-window rate limit per IP/session; hard per-session token
  and artifact quotas; cheap default model.

---

## 12. Deployment topology

| Option | Frontend | Backend | Trade-off | Recommendation |
|---|---|---|---|---|
| **A. Split service** | Next.js on Vercel | FastAPI+LangGraph on Fly.io / Render / Railway | Clean prod story, easy scaling, real "service" to show | **Recommended** |
| B. All-Vercel | Next.js + Python Serverless Functions | Same platform, simplest ops | Cold starts, function time limits on long enhancer calls | Lean MVP |
| C. LangGraph Platform | Next.js on Vercel | Managed LangGraph deploy | Persistence/observability out of the box; extra vendor | If I want to demo the platform |

**Recommended (A):**
- `nguyendangtrac` (Vercel) keeps its current CI/CD; add `/api/chat` BFF + the chat UI.
- `ask-trac-agent` (new repo) → FastAPI + LangGraph, deployed to Fly.io with health checks and
  autoscale-to-zero for cost. `LANGSMITH_*`, `OPENROUTER_API_KEY`, `SUPABASE_*`, `UPSTASH_*` as env.
- Both repos under `trac41799`, each with GitHub-triggered deploys — mirrors the CI/CD I already set
  up for the portfolio, so the whole thing is push-to-deploy.

---

## 13. Appendix — `aio-lab-be` (from-scratch) → LangGraph mapping (the résumé receipt)

| My hand-built concept (production) | LangGraph / ecosystem primitive |
|---|---|
| `AgentState` shared ledger | `StateGraph` typed state + reducers (`add_messages`) |
| Orchestrator main loop | Compiled graph + conditional edges |
| `RouterAgent → RouterOutput` | A `route` node returning a routing key for conditional edges |
| Chameleon tool agent (merged plan+exec) | Tool-calling node / `ToolNode` with bound schemas |
| `EntityResolver` strategy pattern | Pre-tool node normalizing args before `ToolNode` |
| `ContextRegistry` providers | Composable retriever/runnable chain feeding state |
| `SessionManager` non-blocking writes | Checkpointer (`MemorySaver` / `PostgresSaver`) |
| Stream-tag stripper state machine | Structured tool calls + `astream_events` filtering |
| Two-stage artifact + `artifact_replaced` | `make_artifact` node + async enhancement + stream patch |
| Circuit breaker / hallucination guard | Recursion limit + `guard` node + conditional edges |
| Custom OpenRouter fallback client | `ChatOpenAI(base_url=OpenRouter)` + `.with_fallbacks()` |
| SSE base64 event bus | LangGraph streaming → AI SDK Data Stream Protocol |

**Takeaway line for interviews:** *"I designed this architecture from scratch in production; the
portfolio assistant is the same architecture expressed in LangGraph — so I can work in either the
framework or the fundamentals underneath it."*

---

## 14. Phased roadmap

1. **M0 — Corpus & contracts (0.5 wk):** write `bio.md`/`facts.json`; define the Tier-1 component
   schemas (Zod + Pydantic). No LLM yet.
2. **M1 — Backend skeleton (1 wk):** FastAPI + LangGraph `guard→retrieve→route→answer`; pgvector
   ingest; streaming to a curl client; LangSmith wired.
3. **M2 — Frontend chat + Tier-1 UI (1 wk):** `useChat`, `/api/chat` BFF, `GenerativeUIRenderer`
   for the component registry; suggested prompts; reasoning trail.
4. **M3 — Tier-2 artifacts (1 wk):** `make_artifact` node, `ArtifactSandbox`, sanitization/CSP,
   progressive enhancement.
5. **M4 — Hardening (0.5 wk):** rate limit, quotas, refusals, semantic cache, snapshot tests for
   every component, an "Under the hood" page linking this doc.
6. **M5 — Ship:** deploy backend (Fly), enable on the portfolio, add an eval set of ~30 questions.

---

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Cost blow-up from a public bot | Cheap default model, per-session caps, rate limit, cache, enhancer behind a quota |
| Hallucinated claims about me | Grounded RAG + citations + hallucination guard + refusal path |
| XSS via generated HTML | Typed components first; sandboxed iframe + CSP + sanitizer for Tier-2 |
| Backend cold starts hurt TTFT | Scale-to-zero with warmers, or Option B for MVP; emit a `timing` event at t=0 |
| Scope creep into a "real" chatbot | Non-goals in §1.5; guard node enforces scope |

---

*Design grounded in the production architecture of `talentedgeai/aio-lab-be` (agent system + coach-mode
artifact system + SSE event format). Prepared for the `nguyendangtrac` portfolio.*
