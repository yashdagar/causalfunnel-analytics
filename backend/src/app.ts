import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import type { Config } from "./config.js";
import type { Store } from "./db.js";
import { eventsRouter } from "./routes/events.js";
import { pagesRouter } from "./routes/pages.js";
import { sessionsRouter } from "./routes/sessions.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    res.status(400).json({ detail: `${issue.path.join(".") || "request"}: ${issue.message}` });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ detail: "Body is not valid JSON" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ detail: "Body is too large" });
    return;
  }
  console.error(err);
  res.status(500).json({ detail: "Internal server error" });
};

export function createApp(store: Store, config: Pick<Config, "corsOrigins">) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use("/api", cors({ origin: config.corsOrigins === "*" ? true : config.corsOrigins }));
  app.use("/api", express.json({ type: ["application/json", "text/plain"], limit: "64kb" }));

  app.get("/api/health", async (_req, res) => {
    await store.db.command({ ping: 1 });
    res.json({ status: "ok" });
  });
  app.use("/api", eventsRouter(store), sessionsRouter(store), pagesRouter(store));
  app.use("/api", (_req, res) => {
    res.status(404).json({ detail: "Not found" });
  });

  app.use(express.static(publicDir, { maxAge: "5m" }));
  app.get("/", (_req, res) => res.redirect("/demo/"));

  app.use(errorHandler);
  return app;
}
