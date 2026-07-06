import type { RouteDecision } from "./provider";

// Off-topic / prompt-injection gate (deterministic). Refusal is decided ONLY
// here — never by the LLM router — so on-topic questions can never be refused.
export const OFF_TOPIC_RE =
  /\bweather\b|stock price|\brecipe\b|capital of|\b\d+\s*[+\-*/]\s*\d+\b|ignore (previous|above)|system prompt|tell me a joke/;

export function isOffTopic(query: string): boolean {
  return OFF_TOPIC_RE.test(query.toLowerCase());
}

const COMPARISON_RE = /compare|comparison|versus|\bvs\b|difference between/;
const REACT_RE = /interactive|widget|toggle|calculator|playground|explore/;
const ARTIFACT_RE =
  /one[- ]?page|poster|brochure|recruiter summary|design (a|me)|summary/;
const TIMELINE_RE = /timeline|career|journey|\bpath\b|work history|experience/;
const PUBLICATION_RE = /publication|research|paper|ieee/;
const SKILL_RE = /skill|stack|tech stack|tools|toolkit/;
const METRIC_RE = /metric|numbers|stats|impact/;
const CONTACT_RE = /contact|email|reach|hire|linkedin|github/;

/** Deterministic rule-based fast-path (mirrors the Travel Buddy hybrid router).
 *  Returns a high-confidence decision for common intents, or null to defer to
 *  the LLM router. Never returns "refuse" — that is the guard's job. */
export function ruleRoute(query: string): RouteDecision | null {
  const q = query.toLowerCase();
  if (COMPARISON_RE.test(q)) return { route: "renderUI", component: "comparison" };
  if (REACT_RE.test(q)) return { route: "makeReactWidget" };
  if (ARTIFACT_RE.test(q)) return { route: "makeArtifact" };
  if (TIMELINE_RE.test(q)) return { route: "renderUI", component: "timeline" };
  if (PUBLICATION_RE.test(q)) return { route: "renderUI", component: "publicationList" };
  if (SKILL_RE.test(q)) return { route: "renderUI", component: "skillMatrix" };
  if (METRIC_RE.test(q)) return { route: "renderUI", component: "metricGrid" };
  if (CONTACT_RE.test(q)) return { route: "renderUI", component: "contactCard" };
  return null;
}
