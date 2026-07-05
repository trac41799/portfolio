import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { profile, skills, education, awards } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "M.S. Electrical Engineering, IEEE first-author, and production AI engineer — background, skills, and education.",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
            About
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-ink md:text-6xl">
            From error-correction research to production AI systems.
          </h1>
        </Reveal>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed text-muted md:col-span-8 md:col-start-1">
            <Reveal as="p">
              I&apos;m an engineer who moves comfortably between research rigor and
              shipping velocity. My path started in automotive embedded software at{" "}
              <span className="text-ink">Bosch</span>, went deep into deep-learning
              research during my M.S. at the{" "}
              <span className="text-ink">University of Ulsan</span> — where I published
              first-author in an IEEE Transactions journal and won a Best Paper Award —
              and now lives in production AI product engineering at{" "}
              <span className="text-ink">Edge8 AI</span>.
            </Reveal>
            <Reveal as="p" delay={60}>
              Over the last 18 months I&apos;ve shipped and maintained roughly 40
              production repositories: multi-tenant SaaS backends, from-scratch
              multi-agent systems, RAG pipelines, streaming AI interfaces, and a clinical
              risk engine for regulated health-tech. I like owning the whole
              lifecycle — architecture, implementation, testing, and the documentation
              that keeps a system legible.
            </Reveal>
            <Reveal as="p" delay={120}>
              I care about the unglamorous parts: tenant isolation you can prove with a
              test, retrieval strategies you can benchmark, and LLM systems you can
              evaluate rather than hope about. My workflow is deliberately
              AI-augmented — I build the agent tooling I use to build.
            </Reveal>
          </div>

          <div className="md:col-span-4">
            <Reveal>
              <div className="rounded-xl border border-line bg-surface/40 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  At a glance
                </p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-mono text-xs text-faint">Based in</dt>
                    <dd className="mt-1 text-ink">{profile.location}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-faint">Focus</dt>
                    <dd className="mt-1 text-ink">
                      AI-native products · agentic systems · RAG
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-faint">Languages</dt>
                    <dd className="mt-1 text-ink">
                      Vietnamese (native) · English (IELTS 7.0)
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-faint">Status</dt>
                    <dd className="mt-1 text-accent">{profile.availability}</dd>
                  </div>
                </dl>
                <a
                  href={profile.links.cv}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  Download CV ↓
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <SectionHeading index="—" title="Toolkit" />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
            {skills.map((cat, i) => (
              <Reveal key={cat.group} delay={i * 60} className="bg-bg p-7">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                  {cat.group}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line px-3 py-1 text-xs text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Education + Awards */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 md:grid-cols-12">
          <div className="md:col-span-7">
            <Reveal>
              <SectionHeading index="—" title="Education" />
            </Reveal>
            <div className="mt-10 space-y-8">
              {education.map((ed, i) => (
                <Reveal key={ed.school} delay={i * 60}>
                  <div className="border-l border-line-strong pl-6">
                    <p className="font-mono text-xs text-faint">{ed.period}</p>
                    <h3 className="mt-2 font-serif text-2xl text-ink">{ed.degree}</h3>
                    <p className="mt-1 text-sm text-accent">{ed.school}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{ed.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <Reveal>
              <SectionHeading index="—" title="Recognition" />
            </Reveal>
            <div className="mt-10 space-y-px overflow-hidden rounded-xl border border-line bg-line">
              {awards.map((a, i) => (
                <Reveal key={a.label} delay={i * 60} className="bg-bg p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-ink">{a.label}</span>
                    <span className="font-mono text-xs text-muted">{a.detail}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
