import type { UIComponent } from "@/lib/assistant/contracts";

type ProjectCardProps = Extract<
  UIComponent,
  { component: "projectCard" }
>["props"];

export function ProjectCard({
  slug,
  title,
  stack,
  highlights,
  signal,
}: ProjectCardProps) {
  return (
    <article
      data-slug={slug}
      className="rounded-lg border border-line bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg text-ink">{title}</h3>
        {signal ? (
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            {signal}
          </span>
        ) : null}
      </div>
      {stack.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {stack.map((tech, i) => (
            <li
              key={`${tech}-${i}`}
              className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-3 space-y-1.5">
        {highlights.map((highlight, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
