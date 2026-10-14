import { describe, expect, it } from "vitest";
import { click, pageView, useTestApp } from "./helpers.js";

const ctx = useTestApp();

async function send(events: unknown[]) {
  const res = await ctx.api().post("/api/events").send({ events });
  expect(res.status).toBe(202);
}

describe("GET /api/sessions", () => {
  it("lists sessions with their event totals", async () => {
    await send([pageView(), click(), click(), pageView({ session_id: "session-bbbb" })]);

    const res = await ctx.api().get("/api/sessions");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const first = res.body.sessions.find((s: { session_id: string }) => s.session_id === "session-aaaa");
    expect(first).toMatchObject({ event_count: 3, page_views: 1, clicks: 2, entry_url: "https://shop.test/demo/" });
  });

  it("keeps counts correct across batches", async () => {
    await send([pageView()]);
    await send([click(), pageView({ url: "https://shop.test/demo/shop.html" })]);

    const res = await ctx.api().get("/api/sessions");

    expect(res.body.sessions[0]).toMatchObject({ event_count: 3, page_views: 2, clicks: 1 });
  });

  it("orders sessions by most recent activity", async () => {
    await send([
      pageView({ session_id: "session-old", timestamp: "2026-10-01T10:00:00.000Z" }),
      pageView({ session_id: "session-new", timestamp: "2026-10-13T10:00:00.000Z" }),
    ]);

    const res = await ctx.api().get("/api/sessions");

    expect(res.body.sessions.map((s: { session_id: string }) => s.session_id)).toEqual(["session-new", "session-old"]);
  });

  it("reports the session duration and device", async () => {
    await send([
      pageView({ timestamp: "2026-10-05T10:00:00.000Z", viewport: { width: 390, height: 844 } }),
      click({ timestamp: "2026-10-05T10:01:30.000Z" }),
    ]);

    const res = await ctx.api().get("/api/sessions");

    expect(res.body.sessions[0]).toMatchObject({ duration_ms: 90_000, device: "mobile" });
  });

  it("paginates", async () => {
    await send(Array.from({ length: 5 }, (_, i) => pageView({ session_id: `session-${i}000` })));

    const res = await ctx.api().get("/api/sessions?page=2&limit=2");

    expect(res.body).toMatchObject({ total: 5, page: 2, limit: 2 });
    expect(res.body.sessions).toHaveLength(2);
  });

  it("rejects an out of range limit", async () => {
    const res = await ctx.api().get("/api/sessions?limit=1000");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/sessions/:id/events", () => {
  it("returns the session's events in time order", async () => {
    await send([
      click({ timestamp: "2026-10-05T10:00:05.000Z" }),
      pageView({ timestamp: "2026-10-05T10:00:00.000Z" }),
      pageView({ timestamp: "2026-10-05T10:00:09.000Z", url: "https://shop.test/demo/shop.html" }),
      pageView({ session_id: "session-other" }),
    ]);

    const res = await ctx.api().get("/api/sessions/session-aaaa/events");

    expect(res.status).toBe(200);
    expect(res.body.session.event_count).toBe(3);
    expect(res.body.events.map((e: { type: string; path: string }) => `${e.type} ${e.path}`)).toEqual([
      "page_view /demo/",
      "click /demo/",
      "page_view /demo/shop.html",
    ]);
  });

  it("includes click coordinates and the clicked element", async () => {
    await send([click({ x: 321.6, y: 45 })]);

    const res = await ctx.api().get("/api/sessions/session-aaaa/events");

    expect(res.body.events[0]).toMatchObject({ x: 322, y: 45, target: { tag: "button", text: "Add to cart" } });
  });

  it("returns 404 for an unknown session", async () => {
    const res = await ctx.api().get("/api/sessions/missing-session/events");

    expect(res.status).toBe(404);
  });
});
