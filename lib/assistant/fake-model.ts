import { projects, publications, skills } from "@/lib/data";
import type { UIComponentName } from "./contracts";
import facts from "./corpus/facts.json";
import type { Brain, BrainInput, RouteDecision } from "./provider";
import { isOffTopic, ruleRoute } from "./routing";

function decide(query: string): RouteDecision {
  if (isOffTopic(query)) return { route: "refuse" };
  return ruleRoute(query) ?? { route: "answer" };
}

const FAKE_WIDGET_CODE = `function Widget({ data }) {
  const [open, setOpen] = useState(false);
  const skills = (data && data.skills) || ["TypeScript", "Python", "LangGraph", "RAG"];
  return (
    <div style={{ padding: 12, color: "#ededea", fontFamily: "system-ui", fontSize: 14 }}>
      <button
        data-testid="widget-toggle"
        onClick={() => setOpen(function (o) { return !o; })}
        style={{ border: "1px solid #e5b567", borderRadius: 8, padding: "6px 12px", background: "transparent", color: "#e5b567", cursor: "pointer" }}
      >
        {open ? "Hide skills" : "Show skills"}
      </button>
      {open ? (
        <ul style={{ marginTop: 10, paddingLeft: 18 }}>
          {skills.map(function (s, i) { return <li key={i} data-testid="widget-skill">{s}</li>; })}
        </ul>
      ) : null}
    </div>
  );
}`;

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
  const brain: Brain = {
    async route(input: BrainInput): Promise<RouteDecision> {
      return decide(input.query);
    },
    async answer(input: BrainInput): Promise<string> {
      const base = [
        "**Nguyen Dang Trac** is an *AI Automation Engineer* at **Edge8 AI**, where he builds AI-native products end to end. Recent work includes:",
        "",
        "- From-scratch multi-agent systems (router → planner → executor)",
        "- RAG pipelines with hybrid search (`pgvector`, FAISS, BM25)",
        "- Streaming AI UX and inline generative-UI artifacts",
        "",
        "```html-inline",
        '<div style="border:1px solid rgba(255,255,255,0.14);border-radius:12px;padding:14px 16px">',
        '  <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#e5b567">Current role</div>',
        '  <div style="font-size:17px;margin-top:4px;font-weight:600">AI Automation Engineer · Edge8 AI</div>',
        '  <div style="color:#8c8c86;margin-top:6px">Multi-tenant SaaS · agentic systems · RAG · streaming UX</div>',
        "</div>",
        "```",
      ].join("\n");
      const ctx = input.context.trim();
      if (ctx) {
        const slice = ctx.replace(/[#>*_`]/g, "").replace(/\s+/g, " ").slice(0, 200);
        return `${base}\n\n> ${slice}`;
      }
      return base;
    },
    async *answerStream(input: BrainInput) {
      const full = await brain.answer(input);
      const size = 18;
      for (let i = 0; i < full.length; i += size) {
        yield { delta: full.slice(i, i + size) };
        await new Promise((resolve) => setTimeout(resolve, 6));
      }
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
    async reactWidget(_input: BrainInput): Promise<{ code: string; data?: unknown }> {
      const flat = skills.flatMap((s) => s.items).slice(0, 6);
      return { code: FAKE_WIDGET_CODE, data: { skills: flat } };
    },
  };
  return brain;
}
