# Streaming, Loading & Factual Reasoning — Spec + Design

> **Status:** Design proposal (review gate before build)
> **Scope:** Upgrade the Ask-Trac assistant so LLM generation (1) streams token-by-token with a
> smooth unfolding, (2) shows a clean industry-standard loading state, and (3) surfaces **factual**
> reasoning — never templated/canned "fake-out" text.
> **Validation rule (per request):** every change validated **locally and live** against the **real**
> DeepSeek model. Deterministic tests may use the fake brain, but the feature is proven factual with
> the real model, no skips.

---

## 1. Problems today (factual)

1. **No token streaming.** The `answer` node does `await brain.answer()` then emits **one** `content`
   event — the whole answer pops in at once. There is no unfolding.
2. **Canned reasoning.** The graph emits fixed labels ("Understanding your question", "Reading Trac's
   background", "Answering"). These are theatrical, not grounded in what actually happened.
3. **No loading affordance.** Between send and first byte there is no typing/shimmer indicator.

## 2. What the repos actually do (evidence)

- `aiolabz-fe/StreamingMarkdownRenderer.tsx`: during `isStreaming && isLatest` it renders the live
  tail as **plain `whitespace-pre-wrap` text** — comment: *"The SSE stream itself IS the reveal
  animation — no need for a second layer."* Completed messages use `useRevealEngine` (RAF, throttled
  to ~10 notifies/s) + a markdown tokenizer to animate in.
- `aiolabz-fe/StreamingContent.tsx`: `HtmlPlaceholder` = shimmer + sweeping progress bar loader;
  `StreamingText` = per-word framer-motion fade.
- `aio-lab-be/reasoning_vocabulary.py`: ~7 categories × 5 variants of **curated warm phrases**,
  randomly chosen per stage (`finding`/`thinking`/`composing`/`reviewing`…). Grounded in the stage,
  but the sentences are templated flavor. `llm.py` exposes `reasoning_effort` and handles
  `reasoning_content` (real model CoT is technically available).

## 3. Decisions — adopt vs. do better

| Concern | Verdict | Why |
|---|---|---|
| **Loading indicator** | **Adopt** the shimmer/typing pattern | It's the industry standard; theirs is good. We build a clean 3-dot/typing pulse + a shimmer for artifact/widget generation. |
| **Streaming unfolding** | **Do better** (real token streaming) | Their reveal-engine animates *completed* text artificially. We stream real tokens from DeepSeek so the unfolding is genuine and immediate — a caret + subtle fade, no fabricated pacing. Matches their own "SSE stream IS the reveal" conclusion. |
| **Reasoning text** | **Do better** (factual, not vocabulary) | Their vocabulary is curated flavor = the "fake-out" you want gone. We emit **facts**: the real retrieved source titles + count, and the real routing decision. Optional: stream the model's **real** chain-of-thought via `deepseek-reasoner`. |

**Guiding principle:** the reasoning trail may only contain statements that are **true about this
specific turn** — derived from real retriever output, the real router decision, or the model's real
`reasoning_content`. No pre-scripted sentences.

---

## 4. Design

### 4.1 Backend — real token streaming

Add a streaming method to `Brain` (keep the non-streaming ones for props/artifact/react):

```ts
interface Brain {
  // ...existing
  answerStream(input: BrainInput): AsyncIterable<{ delta?: string; reasoningDelta?: string }>;
}
```

- **Real (DeepSeek):** use `model.stream(messages)` (LangChain `ChatOpenAI` supports async iteration).
  Yield `{ delta }` for content chunks. If the model is a reasoner (`deepseek-reasoner`) and exposes
  `reasoning_content` on the chunk, yield `{ reasoningDelta }` too. deepseek-chat → content only.
- **Fake:** yield the canned markdown in ~12–20 char chunks with `await sleep(15)` so tests and the
  no-key path exercise the *same* streaming path deterministically.

`answer` node becomes:

```
for await (const part of brain.answerStream({query, context})) {
  if (part.reasoningDelta) writer({ type: "reasoning_delta", text: part.reasoningDelta });
  if (part.delta)         writer({ type: "content", text: part.delta });   // deltas, not whole
}
writer({ type: "followups", questions: followupsFor(query) });
```

### 4.2 Backend — factual reasoning

Replace canned labels with facts derived from real state:

- **retrieve node:** after `retrieve(query)`, emit **one factual** reasoning event built from the
  actual docs, e.g. `Found 6 relevant notes: Edge8 AI role, Travel Buddy, publications, skills`.
  (`retriever.retrieve` already returns `Doc[]` with `source`; we surface real source labels + count.)
- **classify node:** emit the **real** decision, e.g. `Answering directly`, `Building a comparison`,
  `Generating an interactive widget`, `Composing a one-page summary`, `Out of scope — declining`.
- **generation nodes (artifact/react/renderUI):** emit the factual "generating…" reasoning **before**
  the await, so the loading state reflects real in-flight work; the artifact/widget/component event
  follows when it completes.
- **guard:** no reasoning text (it's instant); scope-decline is surfaced by the classify decision.

Optional (config `LLM_REASONING=deepseek-reasoner`): the answer step streams the model's genuine
`reasoning_content` into the trail. Default off (latency/cost); factual pipeline reasoning always on.

### 4.3 Streaming protocol

- Reuse `content` for answer **deltas** (hook already appends: `content + text`).
- Add `reasoning_delta` (append to the last reasoning line) distinct from `reasoning` (a discrete
  factual step). `reasoning` = a completed fact; `reasoning_delta` = streamed CoT tokens.
- Everything else unchanged; base64 wire for text.

### 4.4 Frontend — loading + smooth unfolding

- **`useAskTrac` throttling:** buffer incoming `content`/`reasoning_delta` deltas and flush on
  `requestAnimationFrame` (coalesce bursts → ≤ ~60 renders/s), preventing markdown re-parse thrash.
  Track `status: "thinking" | "streaming" | "done"` per assistant message.
- **`TypingIndicator`:** a clean 3-dot pulse shown while `status==="thinking"` (sent, no content yet).
  Respects `prefers-reduced-motion`.
- **Streaming answer:** render the accumulating content with `MarkdownRenderer`; while streaming,
  append a **blinking caret** and apply a subtle fade to the message container. (Genuine token
  arrival = the unfolding; no artificial reveal engine.)
- **Generation shimmer:** artifact and React blocks already show skeletons; ensure the skeleton is
  visible during the real generation wait (driven by the pre-await factual reasoning + no block yet).
- **Reasoning trail:** unchanged shell; now shows factual steps (and, if enabled, streamed CoT).

### 4.5 Robustness / perf / a11y

- rAF-coalesced state updates; `MarkdownRenderer` already memoized per content string.
- `AbortController` on the fetch reader so navigation/stop cancels the stream cleanly.
- `aria-live="polite"` on the streaming region; caret hidden from AT; reduced-motion disables pulse/caret.
- Fake stream keeps deterministic tests fast (small sleep, capped).

---

## 5. Validation plan (local + live, factual)

- **Local deterministic:** unit (answerStream fake yields multiple deltas; factual reasoning includes
  a real source label; event round-trip for `reasoning_delta`), component (`TypingIndicator`, caret,
  throttle fold), E2E (assert **multiple** content deltas arrive over time — content length increases
  across polls — and that the reasoning trail contains a real source name, not a canned label).
- **Local real DeepSeek:** POST and confirm the SSE contains **many** `content` events (true
  streaming) and a reasoning line naming real retrieved sources; render in a browser and confirm
  smooth unfolding + typing indicator, 0 console errors.
- **Live real DeepSeek (production):** same checks against `nguyendangtrac.vercel.app` — multiple
  deltas, factual reasoning, visible unfolding.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Markdown re-parse thrash during streaming | rAF coalescing; memoized renderer; plain-tail option if needed |
| Reasoner latency/verbosity | default to factual pipeline reasoning; reasoner behind a flag |
| Streaming stalls / partial SSE block across chunks | hook already buffers on `\n\n` boundaries; add abort + finally |
| "Factual" reasoning leaking sensitive text | only source **labels** + counts + decision, never raw retrieved content |

---

*Prepared from `aiolabz-fe` (StreamingMarkdownRenderer, useRevealEngine, StreamingContent) and
`aio-lab-be` (reasoning_vocabulary.py, openrouter/llm.py). Goal: genuine streaming + honest reasoning.*
