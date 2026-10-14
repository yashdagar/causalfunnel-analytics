import type { AnyBulkWriteOperation } from "mongodb";
import type { Store } from "../db.js";
import { eventSchema, type IncomingEvent } from "../schemas.js";
import type { Device, EventDoc, SessionDoc } from "../types.js";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export interface IngestResult {
  accepted: number;
  duplicates: number;
  rejected: number;
}

export function normalizeUrl(raw: string): { url: string; path: string } {
  const parsed = new URL(raw);
  const path = parsed.pathname.replace(/\/index\.html?$/, "/");
  return { url: `${parsed.origin}${path}`, path };
}

export function deviceFor(viewportWidth: number | undefined): Device | undefined {
  if (viewportWidth === undefined) return undefined;
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablet";
  return "desktop";
}

function toDoc(event: IncomingEvent, receivedAt: Date, userAgent: string | undefined): EventDoc {
  const sent = new Date(event.timestamp);
  const timestamp = sent.getTime() - receivedAt.getTime() > MAX_CLOCK_SKEW_MS ? receivedAt : sent;
  const doc: EventDoc = {
    event_id: event.id,
    session_id: event.session_id,
    type: event.type,
    ...normalizeUrl(event.url),
    timestamp,
    received_at: receivedAt,
  };
  if (event.title) doc.title = event.title;
  if (event.referrer) doc.referrer = event.referrer;
  if (event.viewport) {
    doc.viewport = event.viewport;
    doc.device = deviceFor(event.viewport.width);
  }
  if (event.document) doc.document = event.document;
  if (userAgent) doc.user_agent = userAgent.slice(0, 512);
  if (event.type === "click") {
    doc.x = Math.round(event.x);
    doc.y = Math.round(event.y);
    if (event.target) doc.target = event.target;
  }
  return doc;
}

function sessionUpdates(docs: EventDoc[]): AnyBulkWriteOperation<SessionDoc>[] {
  const bySession = new Map<string, EventDoc[]>();
  for (const doc of docs) {
    const list = bySession.get(doc.session_id) ?? [];
    list.push(doc);
    bySession.set(doc.session_id, list);
  }

  return [...bySession.entries()].map(([sessionId, events]) => {
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const first = events[0];
    const last = events[events.length - 1];
    const pageViews = events.filter((event) => event.type === "page_view").length;
    const onInsert: Partial<SessionDoc> = { entry_url: first.url };
    if (first.device) onInsert.device = first.device;
    if (first.user_agent) onInsert.user_agent = first.user_agent;

    return {
      updateOne: {
        filter: { _id: sessionId },
        update: {
          $min: { first_seen: first.timestamp },
          $max: { last_seen: last.timestamp },
          $inc: { event_count: events.length, page_views: pageViews, clicks: events.length - pageViews },
          $setOnInsert: onInsert,
        },
        upsert: true,
      },
    };
  });
}

export async function ingestEvents(
  store: Store,
  rawEvents: unknown[],
  meta: { userAgent?: string; receivedAt?: Date } = {},
): Promise<IngestResult> {
  const receivedAt = meta.receivedAt ?? new Date();
  const seen = new Set<string>();
  const docs: EventDoc[] = [];
  let rejected = 0;
  let duplicates = 0;

  for (const raw of rawEvents) {
    const parsed = eventSchema.safeParse(raw);
    if (!parsed.success) {
      rejected += 1;
      continue;
    }
    if (seen.has(parsed.data.id)) {
      duplicates += 1;
      continue;
    }
    seen.add(parsed.data.id);
    docs.push(toDoc(parsed.data, receivedAt, meta.userAgent));
  }

  if (docs.length === 0) return { accepted: 0, duplicates, rejected };

  const result = await store.events.bulkWrite(
    docs.map((doc) => ({
      updateOne: { filter: { event_id: doc.event_id }, update: { $setOnInsert: doc }, upsert: true },
    })),
    { ordered: false },
  );
  const inserted = Object.keys(result.upsertedIds).map((index) => docs[Number(index)]);
  duplicates += docs.length - inserted.length;

  if (inserted.length > 0) {
    await store.sessions.bulkWrite(sessionUpdates(inserted), { ordered: false });
  }

  return { accepted: inserted.length, duplicates, rejected };
}
