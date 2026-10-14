import type { Heatmap, Session, SessionJourney, TrackedEvent } from "@/lib/types";

export function session(overrides: Partial<Session> = {}): Session {
  return {
    session_id: "3f2a9c1e-0000-4000-8000-000000000001",
    first_seen: "2026-10-14T10:00:00.000Z",
    last_seen: "2026-10-14T10:02:05.000Z",
    duration_ms: 125_000,
    event_count: 4,
    page_views: 2,
    clicks: 2,
    entry_url: "https://shop.test/demo/",
    device: "desktop",
    ...overrides,
  };
}

export function event(overrides: Partial<TrackedEvent> = {}): TrackedEvent {
  return {
    id: crypto.randomUUID(),
    session_id: "3f2a9c1e-0000-4000-8000-000000000001",
    type: "page_view",
    url: "https://shop.test/demo/",
    path: "/demo/",
    title: "Home",
    timestamp: "2026-10-14T10:00:00.000Z",
    x: null,
    y: null,
    target: null,
    viewport: { width: 1280, height: 800 },
    ...overrides,
  };
}

export function journey(): SessionJourney {
  return {
    session: { ...session(), user_agent: "Mozilla/5.0 Test" },
    events: [
      event(),
      event({ type: "click", timestamp: "2026-10-14T10:00:12.000Z", x: 120, y: 480, target: { tag: "button", text: "Add to cart" }, title: null }),
      event({ url: "https://shop.test/demo/shop.html", path: "/demo/shop.html", title: "Shop", timestamp: "2026-10-14T10:01:00.000Z" }),
      event({
        type: "click",
        url: "https://shop.test/demo/shop.html",
        path: "/demo/shop.html",
        timestamp: "2026-10-14T10:02:05.000Z",
        x: 300,
        y: 900,
        target: { tag: "a", id: "go-to-checkout", text: "Go to checkout" },
      }),
    ],
  };
}

export function heatmap(overrides: Partial<Heatmap> = {}): Heatmap {
  return {
    url: "https://shop.test/demo/",
    device: "desktop",
    viewport_width: 1280,
    page_height: 2000,
    total: 3,
    devices: { mobile: 1, tablet: 0, desktop: 3 },
    clicks: [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 500, y: 900 },
    ],
    ...overrides,
  };
}
