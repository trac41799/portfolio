# Streaming, Loading & Factual Reasoning — TDD Plan

> **For agentic workers:** work task-by-task RED → GREEN → REFACTOR in order (vertical slices). No
> horizontal slicing. No fake-out reasoning text. Every content delta comes from the real/deepseek
> model for final validation; deterministic tests use the fake brain's streaming path.

---

## Phase 0 — Protocol (events.ts)

### T0.1 `reasoning_delta` event + `reasoning` gets structured detail
**RED:** event round-trip for `{type:"reasoning", detail:"Found 6 sources: bio, Edge8, publications, skills"}` and `{type:"reasoning_delta",text:"Actually…"}`. Base64 for text fields.  
**GREEN:** add both to the `AssistantEvent` union, `toWire`/`fromWire`/`parseSSE`.  
**AC:** malformed → `[]`; round-trip preserves detail/text. Existing tests still pass.

---

## Phase 1 — Backend streaming (`provider.ts`, `fake-model.ts`, `runAssistant.ts`)

### T1.1 `Brain.answerStream()` — interface + fake impl
**RED:** `for await (const chunk of brain.answerStream({query,context}))` yields ≥3 objects each with `delta:string`; final chunk delta is empty string.  
**GREEN:** add `answerStream: (input: BrainInput) => AsyncIterable<{delta?:string; reasoningDelta?:string}>` to `Brain`; fake yields the canned text in ~20-char chops with 10ms `await sleep(10)` between; fake tests use `vitest.useFakeTimers()`.  
**AC:** accumulate deltas = full text; `answer()` still works (not broken).

### T1.2 Real `answerStream` — DeepSeek
**RED:** smoke: `brain.answerStream({query,context})` yields ≥5 deltas when run with the real key (manual integration check, not in vitest).  
**GREEN:** `createRealBrain.answerStream` uses `getModel().stream(messages)` → yields `{delta}` for each `AIMessageChunk.content` (non-empty); `reasoningDelta` from `chunk.additional_kwargs?.reasoning_content`. Wrap in try + fallback to `answer()` on error.  
**AC:** stream ends; no unhandled rejection; `answer()` still exists.

### T1.3 `runAssistant` — switch to streaming answer with rAF-batched writes
**RED:** the `answer` node in `graph.ts` emits **multiple** `content` events (delimiting each delta), with the first appearing after the classify reasoning. Total accumulated text = what `brain.answer()` would have produced.  
**GREEN:** `answer` node iterates `brain.answerStream(...)`, calling `config.writer` per delta; the rest of the node unchanged. For `renderUI`/`react`/`artifact` nodes, ALSO iterate `answerStream` through the fallback catch path (if props/widget generate fails).  
**AC:** `graph.test.ts` passes unchanged (content still non-empty, count ≥1). New graph test: event stream for `ask("who is trac")` contains ≥3 content events; accumulated text has expected keyword.

---

## Phase 2 — Factual reasoning (buildGraph)

### T2.1 `retrieve` node emits factual source info
**RED:** after `retrieve`, the event stream contains a `reasoning` event whose `detail` includes at least one real `Doc.source` value (e.g. `"bio.md"` or `"project:ai-lms"`) and a count.  
**GREEN:** `retrieve` node builds a factual detail string: `"Found ${docs.length} sources: ${docs.map(d=>d.source).join(', ')}"` (truncated to ~200 chars). Emits `{type:"reasoning", detail}` instead of current hardcoded step.  
**AC:** test confirms source label present; old hardcoded label absent.

### T2.2 `classify` node emits factual route decision
**RED:** after classify, reasoning includes `"Answering directly"` / `"Building a comparison"` / `"Generating an interactive widget"` / `"Composing a one-page summary"` / `"Out of scope"`.  
**GREEN:** derive from the real `decision.route` + optional `decision.component`.  
**AC:** decision strings match; no canned labels.

### T2.3 Generation nodes emit pre-await reasoning
**RED:** for `makeArtifact`/`makeReactWidget`/`renderUI`, a `reasoning` event fires **immediately** before the async generation call (so the UI shows a loading state for the real wait).  
**GREEN:** insert the appropriate factual line just before each `brain.artifactHtml()`/etc. call.  
**AC:** timing confirmed in E2E (skeleton visible before block appears).

---

## Phase 3 — Frontend loading + unfolding

### T3.1 `TypingIndicator` + `StreamingCaret`
**RED:** `<TypingIndicator />` renders three pulsing dots (testid `typing-indicator`). `<StreamingCaret />` shows a blinking caret. Both skip motion under `prefers-reduced-motion`.  
**GREEN:** pure presentational components with CSS `@keyframes` for pulse/blink.  
**AC:** testid present; `prefers-reduced-motion` media query in the test skips animation class.

### T3.2 `useAskTrac` — rAF coalesce + status field
**RED:** sending a message and feeding 5 SSE content deltas via a mocked stream results in a single render (not 5) after the last delta is processed (rAF batching).  
**GREEN:** add an internal `pendingRef` that buffers `{delta|reasoningDelta}` values; flush on `requestAnimationFrame` callback (coalesce). Add `status: "thinking"|"streaming"|"done"` to each `ChatMessage`. On first `content` or `reasoning` event → `"thinking"`. On first `content` delta → `"streaming"`; `done` → `"done"`.  
**AC:** unit test with mocked `requestAnimationFrame` (vitest.fn). At least 3 content deltas arrive but only 1-2 setState calls fire (batched). Status transitions correctly. `isStreaming` still flips false on done/error.

### T3.3 `MessageList` wires `TypingIndicator`, `StreamingCaret`, status
**RED:** a message with `status:"thinking"` renders `TypingIndicator` below any content. With `status:"streaming"` renders `StreamingCaret` at the end of the markdown content.  
**GREEN:** add `status` to `ChatMessage` type; init to `"done"`; wire indicators.  
**AC:** existing tests unmodified (they import the updated type). New test asserts indicator testid presence by status.

---

## Phase 4 — Generation loading states

### T4.1 Artifact/React skeleton shown during real generation
**RED:** when an `artifact` or `react_artifact` event is expected but not yet emitted, the skeleton (existing) is visible.  
**GREEN:** verify the skeleton is already rendered by `ArtifactSandbox`/`ReactArtifactSandbox` when the block is absent (it is — both show a "preparing" placeholder when no html/code). Ensure T2.3's pre-await reasoning fires so the skeleton's visible long enough.  
**AC:** E2E confirms skeleton exists before the artifact/react frame appears.

---

## Phase 5 — E2E

### T5.1 Streaming assertion
**AC:** open `/ask` → send "What did he build at Edge8?" → poll `getByTestId("assistant-message").first().textContent` at 100ms intervals, verify the string grows at least 3 times across the first 3 seconds. (Not possible with current single-event answer; becomes true with streaming.)

### T5.2 Factual reasoning assertion
**AC:** the reasoning trail shows at least one source label (e.g. "bio" or "edge8" or "project:"), NOT the old canned labels "Understanding your question" or "Answering".

### T5.3 Loading indicator visibility
**AC:** typing indicator appears after send; disappears when first content renders.

### T5.4 Unchanged: zero console errors

---

## Phase 6 — Local + Live real-model validation

### T6.1 Local real DeepSeek streaming check
**POST** `/api/chat` with local prod server → assert ≥3 `event: content` lines (true streaming). Assert a `reasoning` detail contains a real source label. Assert `event: done`.

### T6.2 Live production streaming check
Same as T6.1, against `nguyendangtrac.vercel.app`. Assert ≥3 content events; factual reasoning; no error events.

### T6.3 Live browser rendering
Open `/ask`, send query → assert typing indicator → multiple content frames arrive → caret visible during streaming → caret disappears on done; reasoning contains source labels; 0 console errors.

---

## File map

| File | Action |
|---|---|
| `lib/assistant/events.ts` | + `reasoning_delta` event; `reasoning` gets `detail` field |
| `lib/assistant/events.test.ts` | + round-trip + multi-event |
| `lib/assistant/provider.ts` | + `answerStream` to `Brain`; real impl via `stream()` |
| `lib/assistant/fake-model.ts` | + `answerStream` (deterministic chops + sleep) |
| `lib/assistant/graph.ts` | `answer` → streaming; factual reasoning in `guard`/`retrieve`/`classify`; pre-await in generation nodes |
| `lib/assistant/graph.test.ts` | + multi-delta + factual detail assertions |
| `lib/assistant/runAssistant.ts` | unchanged (streaming handled inside graph nodes) |
| `components/assistant/types.ts` | + `status` on `ChatMessage` |
| `components/assistant/use-ask-trac.ts` | + rAF buffer coalesce; + status; wire `reasoning_delta` |
| `components/assistant/use-ask-trac.test.ts` | + rAF mock tests |
| `components/assistant/typing-indicator.tsx` | new |
| `components/assistant/streaming-caret.tsx` | new |
| `components/assistant/message-list.tsx` | wire indicators by status |
| `components/assistant/message-list.test.tsx` | + status-driven indicator tests |
| `e2e/ask-trac.spec.ts` | + streaming growth assertion |
| `e2e/ask-page.spec.ts` | + streaming growth + factual reasoning assertions |
