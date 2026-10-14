import type { Store } from "../db.js";
import type { EventDoc, SessionDoc } from "../types.js";

export function serializeSession(doc: SessionDoc) {
  return {
    session_id: doc._id,
    first_seen: doc.first_seen.toISOString(),
    last_seen: doc.last_seen.toISOString(),
    duration_ms: doc.last_seen.getTime() - doc.first_seen.getTime(),
    event_count: doc.event_count,
    page_views: doc.page_views,
    clicks: doc.clicks,
    entry_url: doc.entry_url,
    device: doc.device ?? null,
  };
}

export function serializeEvent(doc: EventDoc) {
  return {
    id: doc.event_id,
    session_id: doc.session_id,
    type: doc.type,
    url: doc.url,
    path: doc.path,
    title: doc.title ?? null,
    timestamp: doc.timestamp.toISOString(),
    x: doc.x ?? null,
    y: doc.y ?? null,
    target: doc.target ?? null,
    viewport: doc.viewport ?? null,
  };
}

export async function listSessions(store: Store, { page, limit }: { page: number; limit: number }) {
  const [docs, total] = await Promise.all([
    store.sessions
      .find()
      .sort({ last_seen: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    store.sessions.countDocuments(),
  ]);
  return { sessions: docs.map(serializeSession), total, page, limit };
}

export async function getSessionJourney(store: Store, sessionId: string) {
  const session = await store.sessions.findOne({ _id: sessionId });
  if (!session) return null;
  const events = await store.events
    .find({ session_id: sessionId })
    .sort({ timestamp: 1, _id: 1 })
    .toArray();
  return {
    session: { ...serializeSession(session), user_agent: session.user_agent ?? null },
    events: events.map(serializeEvent),
  };
}
