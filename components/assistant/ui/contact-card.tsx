import type { UIComponent } from "@/lib/assistant/contracts";

type ContactCardProps = Extract<
  UIComponent,
  { component: "contactCard" }
>["props"];

export function ContactCard({ email, links }: ContactCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <a
        href={`mailto:${email}`}
        className="link-underline font-mono text-sm text-accent"
      >
        {email}
      </a>
      {links.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {links.map((link, i) => (
            <li key={`${link.href}-${i}`}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-line-strong px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
