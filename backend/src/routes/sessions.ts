import { Router } from "express";
import type { Store } from "../db.js";
import { sessionsQuerySchema } from "../schemas.js";
import { getSessionJourney, listSessions } from "../services/sessions.js";

export function sessionsRouter(store: Store): Router {
  const router = Router();

  router.get("/sessions", async (req, res) => {
    res.json(await listSessions(store, sessionsQuerySchema.parse(req.query)));
  });

  router.get("/sessions/:id/events", async (req, res) => {
    const journey = await getSessionJourney(store, req.params.id);
    if (!journey) {
      res.status(404).json({ detail: "Session not found" });
      return;
    }
    res.json(journey);
  });

  return router;
}
