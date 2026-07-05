import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import {
  profile,
  metrics,
  intro,
  projects,
  publications,
} from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <Reveal>
          <div className="flex items-center gap-3 font-mono text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {profile.availability}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-7xl">
            {profile.name}
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-4 font-mono text-sm uppercase tracking-[0.24em] text-accent">
            {profile.role}
          </p>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            {profile.tagline}
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5"
            >
              View selected work
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href={`mailto:${profile.email}`}
              className="link-underline text-sm text-muted transition-colors hover:text-ink"
            >
              {profile.email}
            </a>
          </div>
        </Reveal>
      </section>

      {/* Metrics */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line md:grid-cols-4">
          {metrics.map((m, i) => (
            <Reveal
              key={m.label}
              delay={i * 70}
              className="px-6 py-8"
            >
              <div className="font-serif text-4xl text-ink md:text-5xl">{m.value}</div>
              <div className="mt-2 text-xs leading-relaxed text-muted">{m.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Intro / focus */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading index="01" title="What I do" />
        </Reveal>
        <div className="mt-10 grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="text-xl leading-relaxed text-ink md:text-2xl">
              {intro.summary}
            </p>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:col-span-7">
            {intro.focus.map((f, i) => (
              <Reveal key={f.title} delay={i * 80} className="bg-bg p-7">
                <h3 className="font-mono text-sm text-accent">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <SectionHeading index="02" title="Selected work" />
        </Reveal>

        <div className="mt-6 border-t border-line">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 50}>
              <Link
                href={`/work#${p.slug}`}
                className="group grid grid-cols-1 items-baseline gap-4 border-b border-line py-8 transition-colors hover:bg-surface/40 md:grid-cols-12 md:px-4"
              >
                <span className="font-mono text-xs text-faint md:col-span-1">
                  0{i + 1}
                </span>
                <div className="md:col-span-6">
                  <h3 className="font-serif text-2xl text-ink transition-colors group-hover:text-accent md:text-3xl">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{p.category}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-4">
                  {p.stack.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="hidden justify-self-end font-mono text-muted transition-all group-hover:translate-x-1 group-hover:text-accent md:col-span-1 md:block">
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <Link
            href="/work"
            className="link-underline mt-8 inline-block font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            All projects &amp; experience →
          </Link>
        </Reveal>
      </section>

      {/* Publications */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <SectionHeading index="03" title="Research" />
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <p className="text-lg leading-relaxed text-muted">
                Three IEEE publications in deep learning for error-correction coding,
                including a first-author IEEE Transactions journal and a Best Paper Award.
              </p>
            </Reveal>
            <div className="md:col-span-8">
              {publications.map((pub, i) => (
                <Reveal
                  key={pub.citation}
                  delay={i * 60}
                  className="border-t border-line py-6 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-faint">
                    <span className="text-accent">{pub.note}</span>
                    <span>·</span>
                    <span>{pub.venue}</span>
                    <span>·</span>
                    <span>{pub.year}</span>
                  </div>
                  <p className="mt-2 text-ink">
                    {pub.href ? (
                      <a
                        href={pub.href}
                        target="_blank"
                        rel="noreferrer"
                        className="link-underline transition-colors hover:text-accent"
                      >
                        {pub.citation} ↗
                      </a>
                    ) : (
                      pub.citation
                    )}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
