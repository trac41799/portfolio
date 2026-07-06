import { z } from "zod";

export const timelineSchema = z.object({
  items: z
    .array(
      z.object({
        date: z.string(),
        title: z.string(),
        detail: z.string().optional(),
      }),
    )
    .min(1),
});

export const comparisonSchema = z.object({
  columns: z.array(z.string()).min(2),
  rows: z
    .array(z.object({ label: z.string(), values: z.array(z.string()) }))
    .min(1),
});

export const projectCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  stack: z.array(z.string()),
  highlights: z.array(z.string()).min(1),
  signal: z.string().optional(),
});

export const metricGridSchema = z.object({
  metrics: z.array(z.object({ value: z.string(), label: z.string() })).min(1),
});

export const skillMatrixSchema = z.object({
  groups: z
    .array(z.object({ name: z.string(), items: z.array(z.string()) }))
    .min(1),
});

export const publicationListSchema = z.object({
  pubs: z
    .array(
      z.object({
        citation: z.string(),
        venue: z.string(),
        year: z.string(),
        note: z.string(),
        href: z.string().optional(),
      }),
    )
    .min(1),
});

export const contactCardSchema = z.object({
  email: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.string() })),
});

export const uiComponentSchema = z.discriminatedUnion("component", [
  z.object({ component: z.literal("timeline"), props: timelineSchema }),
  z.object({ component: z.literal("comparison"), props: comparisonSchema }),
  z.object({ component: z.literal("projectCard"), props: projectCardSchema }),
  z.object({ component: z.literal("metricGrid"), props: metricGridSchema }),
  z.object({ component: z.literal("skillMatrix"), props: skillMatrixSchema }),
  z.object({
    component: z.literal("publicationList"),
    props: publicationListSchema,
  }),
  z.object({ component: z.literal("contactCard"), props: contactCardSchema }),
]);

export type UIComponent = z.infer<typeof uiComponentSchema>;
export type UIComponentName = UIComponent["component"];

export const UI_COMPONENT_NAMES = [
  "timeline",
  "comparison",
  "projectCard",
  "metricGrid",
  "skillMatrix",
  "publicationList",
  "contactCard",
] as const;

/** Returns a validated UIComponent or null (never throws) — used at the render boundary. */
export function safeParseUIComponent(value: unknown): UIComponent | null {
  const result = uiComponentSchema.safeParse(value);
  return result.success ? result.data : null;
}
