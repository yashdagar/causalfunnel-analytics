import { z } from "zod";

const size = z.object({
  width: z.number().int().nonnegative().max(100_000),
  height: z.number().int().nonnegative().max(1_000_000),
});

const base = z.object({
  id: z.string().min(8).max(64),
  session_id: z.string().min(8).max(64),
  url: z.url({ protocol: /^https?$/ }).max(2048),
  timestamp: z.iso.datetime({ offset: true }),
  title: z.string().max(300).optional(),
  referrer: z.string().max(2048).optional(),
  viewport: size.optional(),
  document: size.optional(),
});

export const pageViewSchema = base.extend({ type: z.literal("page_view") });

export const clickSchema = base.extend({
  type: z.literal("click"),
  x: z.number().nonnegative().max(1_000_000),
  y: z.number().nonnegative().max(1_000_000),
  target: z
    .object({
      tag: z.string().max(32),
      id: z.string().max(128).optional(),
      text: z.string().max(120).optional(),
    })
    .optional(),
});

export const eventSchema = z.discriminatedUnion("type", [pageViewSchema, clickSchema]);

export type IncomingEvent = z.infer<typeof eventSchema>;

export const MAX_BATCH = 50;

export const sessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const heatmapQuerySchema = z.object({
  url: z.url(),
  device: z.enum(["mobile", "tablet", "desktop"]).default("desktop"),
});
