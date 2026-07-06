import type { UIComponent } from "@/lib/assistant/contracts";

type ComparisonProps = Extract<UIComponent, { component: "comparison" }>["props"];

export function Comparison({ columns, rows }: ComparisonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line-strong">
            {columns.map((col, i) => (
              <th
                key={`${col}-${i}`}
                scope="col"
                className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.label}-${i}`} className="border-b border-line">
              <th
                scope="row"
                className="px-3 py-2 text-left align-top font-medium text-ink"
              >
                {row.label}
              </th>
              {row.values.map((value, j) => (
                <td key={j} className="px-3 py-2 align-top text-muted">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
