import Link from "next/link";
import { profile } from "@/lib/data";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-faint">
              Let&apos;s build something
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="link-underline mt-3 inline-block font-serif text-3xl text-ink md:text-4xl"
            >
              {profile.email}
            </a>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-8 text-muted transition-colors hover:text-ink"
            >
              <span>GitHub</span>
              <span className="text-faint transition-colors group-hover:text-accent">
                {profile.links.githubLabel} ↗
              </span>
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-8 text-muted transition-colors hover:text-ink"
            >
              <span>LinkedIn</span>
              <span className="text-faint transition-colors group-hover:text-accent">
                {profile.links.linkedinLabel} ↗
              </span>
            </a>
            <a
              href={profile.links.cv}
              className="group flex items-center justify-between gap-8 text-muted transition-colors hover:text-ink"
            >
              <span>Curriculum Vitae</span>
              <span className="text-faint transition-colors group-hover:text-accent">
                PDF ↓
              </span>
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 font-mono text-[11px] text-faint sm:flex-row sm:items-center">
          <span>
            © {year} {profile.name}
          </span>
          <span>Built with Next.js · Tailwind · deployed on Vercel</span>
          <Link href="/" className="transition-colors hover:text-ink">
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
