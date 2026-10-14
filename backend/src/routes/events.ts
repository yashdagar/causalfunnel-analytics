import { Router } from "express";
import type { Store } from "../db.js";
import { MAX_BATCH } from "../schemas.js";
import { ingestEvents } from "../services/events.js";

function extractEvents(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const events = (body as { events?: unknown }).events;
    if (Array.isArray(events)) return events;
    if ("type" in body) return [body];
  }
  return null;
}

export function eventsRouter(store: Store): Router {
  const router = Router();

  router.post("/events", async (req, res) => {
    const events = extractEvents(req.body);
    if (!events || events.length === 0) {
      res.status(400).json({ detail: "Expected an event, an array of events or { events: [...] }" });
      return;
    }
    if (events.length > MAX_BATCH) {
      res.status(413).json({ detail: `A batch can hold at most ${MAX_BATCH} events` });
      return;
    }

    const result = await ingestEvents(store, events, { userAgent: req.get("user-agent") });
    const allRejected = result.rejected === events.length;
    res.status(allRejected ? 400 : 202).json(allRejected ? { detail: "No valid events in batch", ...result } : result);
  });

  return router;
}
