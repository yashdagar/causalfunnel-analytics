import { describe, expect, it } from "vitest";
import { click, pageView, useTestApp } from "./helpers.js";

const ctx = useTestApp();
const home = "https://shop.test/demo/";

async function send(events: unknown[]) {
  const res = await ctx.api().post("/api/events").send({ events });
  expect(res.status).toBe(202);
}

describe("GET /api/pages", () => {
  it("lists tracked pages with view and click counts, most clicked first", async () => {
    await send([
      pageView(),
      pageView({ url: "https://shop.test/demo/shop.html" }),
      click({ url: "https://shop.test/demo/shop.html" }),
      click({ url: "https://shop.test/demo/shop.html" }),
      click(),
    ]);

    const res = await ctx.api().get("/api/pages");

    expect(res.body.pages.map((p: { url: string; page_views: number; clicks: number }) => [p.url, p.page_views, p.clicks])).toEqual([
      ["https://shop.test/demo/shop.html", 1, 2],
      [home, 1, 1],
    ]);
  });
});

describe("GET /api/heatmap", () => {
  it("returns click positions for a page", async () => {
    await send([click({ x: 10, y: 20 }), click({ x: 30, y: 40 }), click({ url: "https://shop.test/demo/shop.html" })]);

    const res = await ctx.api().get("/api/heatmap").query({ url: home });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.clicks).toEqual(expect.arrayContaining([{ x: 10, y: 20 }, { x: 30, y: 40 }]));
  });

  it("matches the page regardless of query string", async () => {
    await send([click()]);

    const res = await ctx.api().get("/api/heatmap").query({ url: `${home}?ref=email` });

    expect(res.body.total).toBe(1);
  });

  it("splits clicks by device class and reports counts per device", async () => {
    await send([
      click({ viewport: { width: 390, height: 844 } }),
      click({ viewport: { width: 1440, height: 900 } }),
      click({ viewport: { width: 1280, height: 800 } }),
    ]);

    const desktop = await ctx.api().get("/api/heatmap").query({ url: home });
    const mobile = await ctx.api().get("/api/heatmap").query({ url: home, device: "mobile" });

    expect(desktop.body.total).toBe(2);
    expect(mobile.body.total).toBe(1);
    expect(desktop.body.devices).toEqual({ mobile: 1, tablet: 0, desktop: 2 });
  });

  it("reports the layout width and page height to draw clicks against", async () => {
    await send([
      click({ viewport: { width: 1280, height: 800 }, document: { width: 1280, height: 2400 } }),
      click({ viewport: { width: 1440, height: 900 }, document: { width: 1440, height: 2100 }, y: 2600 }),
    ]);

    const res = await ctx.api().get("/api/heatmap").query({ url: home });

    expect(res.body.viewport_width).toBe(1440);
    expect(res.body.page_height).toBe(2601);
  });

  it("falls back to a default width when a page has no clicks", async () => {
    const res = await ctx.api().get("/api/heatmap").query({ url: home, device: "tablet" });

    expect(res.body).toMatchObject({ total: 0, clicks: [], viewport_width: 820, page_height: 0 });
  });

  it("requires a valid url", async () => {
    const res = await ctx.api().get("/api/heatmap").query({ url: "not a url" });

    expect(res.status).toBe(400);
  });
});

describe("static files", () => {
  it("serves the tracking script", async () => {
    const res = await ctx.api().get("/tracker.js");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("javascript");
  });

  it("serves the demo store", async () => {
    const res = await ctx.api().get("/demo/");

    expect(res.status).toBe(200);
    expect(res.text).toContain('src="/tracker.js"');
  });
});
