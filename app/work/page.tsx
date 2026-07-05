import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { projects, experience } from "@/lib/data";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects and professional experience — AI-native SaaS, RAG systems, and agent orchestration.",
};

export default function WorkPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
            Selected work
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-6xl">
            Systems shipped to production, not slideware.
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            A close look at four projects from the last 18 months — the architecture
            decisions, the measured results, and the scope of ownership behind each.
          </p>
        </Reveal>
      </section>

      {/* Projects */}
      <section className="mx-auto max-w-6xl px-6">
        {projects.map((p, i) => (
          <article
            key={p.slug}
            id={p.slug}
            className="scroll-mt-24 border-t border-line py-16"
          >
            <div className="grid gap-10 md:grid-cols-12">
              <div className="md:col-span-4">
                <Reveal>
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-accent tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                      {p.category}
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-3xl leading-tight text-ink md:text-4xl">
                    {p.title}
                  </h2>
                  <dl className="mt-6 space-y-3 font-mono text-xs">
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-faint">Role</dt>
                      <dd className="text-right text-muted">{p.role}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-faint">Period</dt>
                      <dd className="text-right text-muted">{p.period}</dd>
                    </div>
                  </dl>
                  {p.signal && (
                    <p className="mt-6 rounded-lg border border-accent/25 bg-accent-dim px-4 py-3 text-xs leading-relaxed text-accent">
                      {p.signal}
                    </p>
                  )}
                </Reveal>
              </div>

              <div className="md:col-span-8">
                <Reveal delay={80}>
                  <p className="text-lg leading-relaxed text-ink">{p.summary}</p>
                </Reveal>
                <ul className="mt-8 space-y-4">
                  {p.highlights.map((h, hi) => (
                    <Reveal
                      key={hi}
                      delay={100 + hi * 50}
                      as="li"
                      className="flex gap-4 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>{h}</span>
                    </Reveal>
                  ))}
                </ul>
                <Reveal delay={140}>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Experience */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading index="—" title="Experience" />
        </Reveal>
        <div className="mt-12">
          {experience.map((job, i) => (
            <Reveal key={job.company} delay={i * 60}>
              <div className="grid gap-6 border-t border-line py-10 md:grid-cols-12">
                <div className="md:col-span-4">
                  <h3 className="font-serif text-2xl text-ink">{job.company}</h3>
                  <p className="mt-1 text-sm text-accent">{job.role}</p>
                  <p className="mt-3 font-mono text-xs text-faint">
                    {job.period} · {job.location}
                  </p>
                </div>
                <ul className="space-y-4 md:col-span-8">
                  {job.points.map((point, pi) => (
                    <li
                      key={pi}
                      className="flex gap-4 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
