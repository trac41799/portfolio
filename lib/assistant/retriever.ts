import { readFileSync } from "node:fs";
import path from "node:path";
import { projects, publications, skills } from "@/lib/data";
import facts from "./corpus/facts.json";

export interface Doc {
  id: string;
  text: string;
  source: string;
}

function corpusPath(file: string): string {
  return path.join(process.cwd(), "lib", "assistant", "corpus", file);
}

function chunkMarkdown(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

export function buildCorpus(): Doc[] {
  const docs: Doc[] = [];

  const bio = readFileSync(corpusPath("bio.md"), "utf8");
  chunkMarkdown(bio).forEach((text, i) =>
    docs.push({ id: `bio-${i}`, text, source: "bio.md" }),
  );

  const faq = readFileSync(corpusPath("faq.md"), "utf8");
  chunkMarkdown(faq).forEach((text, i) =>
    docs.push({ id: `faq-${i}`, text, source: "faq.md" }),
  );

  for (const p of projects) {
    docs.push({
      id: `project-${p.slug}`,
      text: `${p.title} (${p.category}). Role: ${p.role}. ${p.summary} Highlights: ${p.highlights.join(" ")} Stack: ${p.stack.join(", ")}. ${p.signal ?? ""}`,
      source: `project:${p.slug}`,
    });
  }

  docs.push({
    id: "publications",
    text: `Publications: ${publications
      .map((pub) => `${pub.citation} — ${pub.venue} (${pub.year}), ${pub.note}.`)
      .join(" ")}`,
    source: "publications",
  });

  docs.push({
    id: "skills",
    text: `Skills: ${skills
      .map((s) => `${s.group}: ${s.items.join(", ")}`)
      .join("; ")}`,
    source: "skills",
  });

  docs.push({
    id: "facts-identity",
    text: `${facts.identity.name}, ${facts.identity.role}, based in ${facts.identity.location}. ${facts.identity.availability}. Contact ${facts.identity.email}, ${facts.identity.github}, ${facts.identity.linkedin}.`,
    source: "facts.json",
  });
  docs.push({
    id: "facts-timeline",
    text: facts.timeline
      .map((t) => `${t.date} ${t.title}: ${t.detail}`)
      .join(" "),
    source: "facts.json",
  });
  docs.push({
    id: "facts-metrics",
    text: facts.metrics.map((m) => `${m.value} ${m.label}`).join(". "),
    source: "facts.json",
  });

  return docs;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 0);
}

let corpusCache: Doc[] | null = null;

function corpus(): Doc[] {
  if (corpusCache === null) corpusCache = buildCorpus();
  return corpusCache;
}

export function retrieve(query: string, k = 4): Doc[] {
  const queryTokens = tokenize(query.trim());
  if (queryTokens.length === 0) return [];

  const scored = corpus()
    .map((doc) => {
      const counts = new Map<string, number>();
      for (const token of tokenize(doc.text)) {
        counts.set(token, (counts.get(token) ?? 0) + 1);
      }
      let score = 0;
      for (const qt of queryTokens) score += counts.get(qt) ?? 0;
      return { doc, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort(
    (a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id),
  );

  return scored.slice(0, k).map((entry) => entry.doc);
}
