import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eventSchema } from "../src/schemas.js";

const source = readFileSync(new URL("../public/tracker.js", import.meta.url), "utf8");

interface SentEvent {
  id: string;
  session_id: string;
  type: string;
  url: string;
  x?: number;
  y?: number;
  target?: { tag: string; id?: string; text?: string };
}

type TrackerWindow = JSDOM["window"] & { CausalFunnel: { flush(): void; sessionId(): string } };

const doms: JSDOM[] = [];

afterEach(() => {
  doms.splice(0).forEach((dom) => dom.window.close());
  vi.useRealTimers();
});

function load(options: { url?: string; storage?: Record<string, string>; blockStorage?: boolean } = {}) {
  const dom = new JSDOM(
    `<!doctype html><title>Demo</title><body><main><button id="buy"><span>Buy now</span></button><input name="email" placeholder="Email" /></main></body>`,
    { url: options.url ?? "https://shop.test/demo/", runScripts: "outside-only" },
  );
  doms.push(dom);
  const window = dom.window as TrackerWindow;
  const batches: string[] = [];

  Object.defineProperty(window.navigator, "sendBeacon", {
    value: (endpoint: string, blob: Blob) => {
      batches.push(endpoint);
      void blob.text().then((text) => batches.push(text));
      return true;
    },
  });
  for (const [key, value] of Object.entries(options.storage ?? {})) window.localStorage.setItem(key, value);
  if (options.blockStorage) {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new window.DOMException("blocked", "SecurityError");
      },
    });
  }

  const script = window.document.createElement("script");
  script.setAttribute("data-endpoint", "https://api.test/api/events");
  window.document.head.appendChild(script);
  Object.defineProperty(window.document, "currentScript", { configurable: true, get: () => script });
  window.eval(source);
  Object.defineProperty(window.document, "currentScript", { configurable: true, get: () => null });

  async function sent(): Promise<SentEvent[]> {
    window.CausalFunnel.flush();
    await new Promise((resolve) => setTimeout(resolve, 10));
    return batches
      .filter((entry) => entry.startsWith("{"))
      .flatMap((entry) => (JSON.parse(entry) as { events: SentEvent[] }).events);
  }

  return { window, batches, sent };
}

describe("tracker.js", () => {
  it("sends a page_view when the page loads", async () => {
    const { sent } = load();

    const events = await sent();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "page_view", url: "https://shop.test/demo/" });
  });

  it("posts to the endpoint from the data-endpoint attribute", async () => {
    const { batches, sent } = load();

    await sent();

    expect(batches[0]).toBe("https://api.test/api/events");
  });

  it("sends clicks with page coordinates and the clicked element", async () => {
    const { window, sent } = load();
    const span = window.document.querySelector("#buy span")!;

    span.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 120, clientY: 48 }));
    const events = await sent();

    expect(events[1]).toMatchObject({ type: "click", x: 120, y: 48, target: { tag: "button", id: "buy", text: "Buy now" } });
  });

  it("never records what was typed into an input", async () => {
    const { window, sent } = load();
    const input = window.document.querySelector("input")!;
    input.value = "secret@example.com";

    input.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const events = await sent();

    expect(JSON.stringify(events)).not.toContain("secret@example.com");
    expect(events[1].target).toEqual({ tag: "input", text: "Email" });
  });

  it("sends events the API accepts", async () => {
    const { window, sent } = load();

    window.document.body.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 5, clientY: 5 }));
    const events = await sent();

    for (const event of events) expect(eventSchema.safeParse(event).success).toBe(true);
  });

  it("uses one session id for every event on the page", async () => {
    const { window, sent } = load();

    window.document.body.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const events = await sent();

    expect(new Set(events.map((event) => event.session_id)).size).toBe(1);
  });

  it("continues the stored session on the next page", async () => {
    const first = load();
    const [firstEvent] = await first.sent();

    const second = load({ storage: { cf_session: first.window.localStorage.getItem("cf_session")! } });
    const [secondEvent] = await second.sent();

    expect(secondEvent.session_id).toBe(firstEvent.session_id);
  });

  it("starts a new session after 30 minutes of inactivity", async () => {
    const stale = JSON.stringify({ id: "old-session-id", last: Date.now() - 31 * 60 * 1000 });
    const { sent } = load({ storage: { cf_session: stale } });

    const [event] = await sent();

    expect(event.session_id).not.toBe("old-session-id");
  });

  it("falls back to a cookie when localStorage is unavailable", async () => {
    const { window, sent } = load({ blockStorage: true });

    const [event] = await sent();

    expect(window.document.cookie).toContain(`cf_session=${encodeURIComponent(event.session_id)}`);
  });

  it("tracks client side navigation as a new page_view", async () => {
    const { window, sent } = load();

    window.history.pushState({}, "", "/demo/shop.html");
    window.history.pushState({}, "", "/demo/shop.html#reviews");
    const events = await sent();

    expect(events.map((event) => event.url)).toEqual(["https://shop.test/demo/", "https://shop.test/demo/shop.html"]);
  });

  it("sends queued events together as one batch after a short delay", async () => {
    vi.useFakeTimers();
    const { window, batches } = load();
    window.document.body.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(batches).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    expect(batches.filter((entry) => entry === "https://api.test/api/events")).toHaveLength(1);
  });

  it("flushes queued events when the page is hidden", async () => {
    const { window, batches } = load();

    window.dispatchEvent(new window.Event("pagehide"));

    expect(batches).toContain("https://api.test/api/events");
  });

  it("gives every event a unique id", async () => {
    const { window, sent } = load();

    for (let i = 0; i < 5; i += 1) window.document.body.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const events = await sent();

    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });
});
