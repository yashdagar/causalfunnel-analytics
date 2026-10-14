import type { Store } from "../db.js";
import type { Device } from "../types.js";
import { normalizeUrl } from "./events.js";

export const MAX_HEATMAP_CLICKS = 5000;

const DEFAULT_WIDTH: Record<Device, number> = { mobile: 390, tablet: 820, desktop: 1280 };

export async function listPages(store: Store) {
  const pages = await store.events
    .aggregate<{ _id: string; page_views: number; clicks: number; last_seen: Date }>([
      {
        $group: {
          _id: "$url",
          page_views: { $sum: { $cond: [{ $eq: ["$type", "page_view"] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$type", "click"] }, 1, 0] } },
          last_seen: { $max: "$timestamp" },
        },
      },
      { $sort: { clicks: -1, page_views: -1, _id: 1 } },
    ])
    .toArray();
  return pages.map((page) => ({
    url: page._id,
    page_views: page.page_views,
    clicks: page.clicks,
    last_seen: page.last_seen.toISOString(),
  }));
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function getHeatmap(store: Store, rawUrl: string, device: Device) {
  const { url } = normalizeUrl(rawUrl);
  const filter = { url, type: "click" as const, device };

  const [clicks, total, deviceCounts] = await Promise.all([
    store.events
      .find(filter, { projection: { x: 1, y: 1, viewport: 1, document: 1 } })
      .sort({ timestamp: -1 })
      .limit(MAX_HEATMAP_CLICKS)
      .toArray(),
    store.events.countDocuments(filter),
    store.events
      .aggregate<{ _id: Device | null; count: number }>([
        { $match: { url, type: "click" } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const devices: Record<Device, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const { _id, count } of deviceCounts) if (_id) devices[_id] = count;

  const viewportWidth =
    median(clicks.flatMap((click) => (click.viewport ? [click.viewport.width] : []))) ?? DEFAULT_WIDTH[device];
  const pageHeight = Math.max(
    0,
    ...clicks.map((click) => Math.max(click.document?.height ?? 0, (click.y ?? 0) + 1)),
  );

  return {
    url,
    device,
    viewport_width: viewportWidth,
    page_height: pageHeight,
    total,
    devices,
    clicks: clicks.map((click) => ({ x: click.x ?? 0, y: click.y ?? 0 })),
  };
}
