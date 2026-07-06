import { projects, publications, skills } from "@/lib/data";
import type { UIComponentName } from "./contracts";
import facts from "./corpus/facts.json";
import type { Brain, BrainInput, RouteDecision } from "./provider";

const REFUSE_RE =
  /weather|stock price|recipe|capital of|\b\d+\s*[+\-*/]\s*\d+\b|ignore (previous|above)|system prompt|tell me a joke/;
const COMPARISON_RE = /compare|comparison|versus|\bvs\b|difference between/;
const ARTIFACT_RE =
  /one[- ]?page|poster|brochure|recruiter summary|design (a|me)|summary/;
const TIMELINE_RE =
  /timeline|career|journey|\bpath\b|work history|experience/;
const PUBLICATION_RE = /publication|research|paper|ieee/;
const SKILL_RE = /skill|stack|tech stack|tools|toolkit/;
const METRIC_RE = /metric|numbers|stats|impact/;
const CONTACT_RE = /contact|email|reach|hire|linkedin|github/;

function decide(query: string): RouteDecision {
  const q = query.toLowerCase();
  if (REFUSE_RE.test(q)) return { route: "refuse" };
  if (COMPARISON_RE.test(q)) return { route: "renderUI", component: "comparison" };
  if (ARTIFACT_RE.test(q)) return { route: "makeArtifact" };
  if (TIMELINE_RE.test(q)) return { route: "renderUI", component: "timeline" };
  if (PUBLICATION_RE.test(q))
    return { route: "renderUI", component: "publicationList" };
  if (SKILL_RE.test(q)) return { route: "renderUI", component: "skillMatrix" };
  if (METRIC_RE.test(q)) return { route: "renderUI", component: "metricGrid" };
  if (CONTACT_RE.test(q)) return { route: "renderUI", component: "contactCard" };
  return { route: "answer" };
}

function buildProps(component: UIComponentName): unknown {
  switch (component) {
    case "timeline":
      return {
        items: facts.timeline.map((t) => ({
          date: t.date,
          title: t.title,
          detail: t.detail,
        })),
      };
    case "comparison": {
      const [lms, travel] = projects;
      return {
        columns: ["AI LMS", "Travel Buddy"],
        rows: [
          { label: "Role", values: [lms.role, travel.role] },
          {
            label: "Core stack",
            values: [lms.stack.join(", "), travel.stack.join(", ")],
          },
          {
            label: "Scale",
            values: [lms.signal ?? "—", travel.signal ?? "—"],
          },
        ],
      };
    }
    case "projectCard": {
      const p = projects[0];
      return {
        slug: p.slug,
        title: p.title,
        stack: [...p.stack],
        highlights: [...p.highlights],
        signal: p.signal,
      };
    }
    case "metricGrid":
      return {
        metrics: facts.metrics.map((m) => ({ value: m.value, label: m.label })),
      };
    case "skillMatrix":
      return {
        groups: skills.map((s) => ({ name: s.group, items: [...s.items] })),
      };
    case "publicationList":
      return {
        pubs: publications.map((pub) => ({
          citation: pub.citation,
          venue: pub.venue,
          year: pub.year,
          note: pub.note,
          href: pub.href,
        })),
      };
    case "contactCard":
      return {
        email: facts.identity.email,
        links: [
          { label: "GitHub", href: facts.identity.github },
          { label: "LinkedIn", href: facts.identity.linkedin },
        ],
      };
  }
}

export function createFakeBrain(): Brain {
  return {
    async route(input: BrainInput): Promise<RouteDecision> {
      return decide(input.query);
    },
    async answer(input: BrainInput): Promise<string> {
      const base =
        "Nguyen Dang Trac is an AI Automation Engineer at Edge8 AI, where he builds from-scratch multi-agent systems, retrieval-augmented generation pipelines, and multi-tenant SaaS platforms shipped to production on Supabase and Vercel.";
      const ctx = input.context.trim();
      if (ctx) {
        const slice = ctx.replace(/\s+/g, " ").slice(0, 240);
        return `${base} Drawing on his background: ${slice}`;
      }
      return base;
    },
    async props(
      input: BrainInput & { component: UIComponentName },
    ): Promise<unknown> {
      return buildProps(input.component);
    },
    async artifactHtml(_input: BrainInput): Promise<string> {
      return [
        "<h1>Nguyen Dang Trac</h1>",
        "<p>AI Automation Engineer building AI-native products end to end.</p>",
        "<ul>",
        "<li>From-scratch multi-agent systems and RAG pipelines at Edge8 AI</li>",
        "<li>Multi-tenant SaaS on Supabase and Vercel</li>",
        "<li>3 IEEE publications, including a Best Paper Award at ICGHIT 2024</li>",
        "</ul>",
      ].join("");
    },
  };
}
