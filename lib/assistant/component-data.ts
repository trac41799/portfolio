import { projects, publications, skills } from "@/lib/data";
import facts from "./corpus/facts.json";
import type { UIComponentName } from "./contracts";

/** Pre-templated component props are built from Trac's own structured data
 *  (the source of truth), NOT paraphrased by an LLM — so they are always
 *  schema-valid and factually exact. The model only decides *which* component
 *  to show; the data comes from here. */
export function buildComponentProps(component: UIComponentName): unknown {
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
        columns: ["Aspect", "AI LMS", "Travel Buddy"],
        rows: [
          { label: "Category", values: [lms.category, travel.category] },
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
