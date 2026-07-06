import type { UIComponent } from "@/lib/assistant/contracts";

type PublicationListProps = Extract<
  UIComponent,
  { component: "publicationList" }
>["props"];

export function PublicationList({ pubs }: PublicationListProps) {
  return (
    <ul className="space-y-3">
      {pubs.map((pub, i) => (
        <li key={i} className="border-l border-line pl-3">
          <p className="text-sm text-ink">
            {pub.href ? (
              <a
                href={pub.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {pub.citation}
              </a>
            ) : (
              pub.citation
            )}
          </p>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {pub.venue} · {pub.year}
          </p>
          {pub.note ? (
            <p className="mt-1 text-xs text-muted">{pub.note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
