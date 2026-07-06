import type { UIComponent } from "@/lib/assistant/contracts";

type SkillMatrixProps = Extract<
  UIComponent,
  { component: "skillMatrix" }
>["props"];

export function SkillMatrix({ groups }: SkillMatrixProps) {
  return (
    <div className="space-y-3">
      {groups.map((group, i) => (
        <div key={`${group.name}-${i}`}>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {group.name}
          </h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {group.items.map((item, j) => (
              <li
                key={`${item}-${j}`}
                className="rounded border border-line px-2 py-0.5 text-xs text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
