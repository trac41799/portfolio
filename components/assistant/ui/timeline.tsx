import type { UIComponent } from "@/lib/assistant/contracts";

type TimelineProps = Extract<UIComponent, { component: "timeline" }>["props"];

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {items.map((item, i) => (
        <li key={`${item.date}-${i}`} className="relative">
          <span
            className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 rounded-full bg-accent"
            aria-hidden
          />
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted tabular-nums">
            {item.date}
          </div>
          <div className="mt-0.5 text-sm font-medium text-ink">{item.title}</div>
          {item.detail ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
