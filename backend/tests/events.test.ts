import { describe, expect, it } from "vitest";
import { click, pageView, useTestApp } from "./helpers.js";

const ctx = useTestApp();

describe("POST /api/events", () => {
  it("accepts a batch of page views and clicks", async () => {
    const res = await ctx.api().post("/api/events").send({ events: [pageView(), click()] });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: 2, duplicates: 0, rejected: 0 });
  });

  it("accepts a single event object", async () => {
    const res = await ctx.api().post("/api/events").send(pageView());

    expect(res.status).toBe(202);
    expect(res.body.accepted).toBe(1);
  });

  it("parses text/plain bodies sent by sendBeacon", async () => {
    const res = await ctx
      .api()
      .post("/api/events")
      .set("Content-Type", "text/plain;charset=UTF-8")
      .send(JSON.stringify({ events: [pageView()] }));

    expect(res.status).toBe(202);
    expect(res.body.accepted).toBe(1);
  });

  it("ignores events it has already stored so retries do not double count", async () => {
    const event = pageView();
    await ctx.api().post("/api/events").send({ events: [event] });

    const res = await ctx.api().post("/api/events").send({ events: [event, event] });
    const sessions = await ctx.api().get("/api/sessions");

    expect(res.body).toEqual({ accepted: 0, duplicates: 2, rejected: 0 });
    expect(sessions.body.sessions[0].event_count).toBe(1);
  });

  it("rejects invalid events and keeps the valid ones", async () => {
    const res = await ctx
      .api()
      .post("/api/events")
      .send({ events: [pageView(), click({ x: undefined }), pageView({ url: "javascript:alert(1)" })] });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: 1, duplicates: 0, rejected: 2 });
  });

  it("returns 400 when no event in the batch is valid", async () => {
    const res = await ctx.api().post("/api/events").send({ events: [{ type: "scroll" }] });

    expect(res.status).toBe(400);
    expect(res.body.rejected).toBe(1);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await ctx.api().post("/api/events").set("Content-Type", "text/plain").send("not json");

    expect(res.status).toBe(400);
  });

  it("returns 413 for batches over the size limit", async () => {
    const events = Array.from({ length: 51 }, () => pageView());

    const res = await ctx.api().post("/api/events").send({ events });

    expect(res.status).toBe(413);
  });

  it("allows cross-origin posts from any site", async () => {
    const res = await ctx.api().post("/api/events").set("Origin", "https://another-site.test").send(pageView());

    expect(res.headers["access-control-allow-origin"]).toBe("https://another-site.test");
  });

  it("strips query strings, hashes and index.html from page URLs", async () => {
    await ctx
      .api()
      .post("/api/events")
      .send({ events: [pageView({ url: "https://shop.test/demo/index.html?utm_source=ad#top" })] });

    const res = await ctx.api().get("/api/sessions/session-aaaa/events");

    expect(res.body.events[0].url).toBe("https://shop.test/demo/");
  });

  it("replaces client timestamps that are far in the future with the server time", async () => {
    await ctx
      .api()
      .post("/api/events")
      .send({ events: [pageView({ timestamp: "2999-01-01T00:00:00.000Z" })] });

    const res = await ctx.api().get("/api/sessions/session-aaaa/events");

    expect(new Date(res.body.events[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
