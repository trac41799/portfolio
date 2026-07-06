import type { UIComponent } from "@/lib/assistant/contracts";

type MetricGridProps = Extract<
  UIComponent,
  { component: "metricGrid" }
>["props"];

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((metric, i) => (
        <div
          key={`${metric.label}-${i}`}
          className="rounded-lg border border-line bg-surface p-3"
        >
          <div className="font-serif text-2xl text-accent tabular-nums">
            {metric.value}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
