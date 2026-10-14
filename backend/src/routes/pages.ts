import { Router } from "express";
import type { Store } from "../db.js";
import { heatmapQuerySchema } from "../schemas.js";
import { getHeatmap, listPages } from "../services/heatmap.js";

export function pagesRouter(store: Store): Router {
  const router = Router();

  router.get("/pages", async (_req, res) => {
    res.json({ pages: await listPages(store) });
  });

  router.get("/heatmap", async (req, res) => {
    const { url, device } = heatmapQuerySchema.parse(req.query);
    res.json(await getHeatmap(store, url, device));
  });

  return router;
}
