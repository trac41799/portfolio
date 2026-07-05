# Personal Portfolio — Nguyen Dang Trac

Dark, minimal, engineered portfolio built with **Next.js (App Router) + Tailwind v4**, deployed on **Vercel**.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

```bash
npx vercel        # preview
npx vercel --prod # production
```

Or push to a Git repo and import it at vercel.com — zero config needed.

## Content

All copy lives in **`lib/data.ts`** — profile, metrics, projects, experience,
publications, skills, education, and awards. Edit that one file to update the site.

## To add your CV PDF

Drop your compiled CV at **`public/NguyenDangTrac_CV.pdf`**. The nav "CV ↓",
the About page button, and the footer all link to `/NguyenDangTrac_CV.pdf`.
(To change the filename, update `profile.links.cv` in `lib/data.ts`.)

## Design system

- **Fonts:** Geist Sans (body), Geist Mono (labels/metrics), Instrument Serif (display)
- **Theme:** near-black canvas, warm amber accent, defined in `app/globals.css` (`@theme`)
- **Motion:** scroll-reveal via `components/reveal.tsx`; respects `prefers-reduced-motion`

## Structure

```
app/
  layout.tsx        fonts, nav, footer, metadata
  page.tsx          Home (hero, metrics, focus, work teasers, research)
  work/page.tsx     Project deep-dives + experience timeline
  about/page.tsx    Bio, toolkit, education, recognition
  globals.css       design tokens + base styles
  icon.svg          favicon monogram
components/          nav, footer, reveal, section-heading
lib/data.ts         single source of truth for all content
```
