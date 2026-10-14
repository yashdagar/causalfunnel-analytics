"use client";

import { useMemo, useRef, useState } from "react";

import { plural } from "@/lib/format";
import { bucketClicks, heatColor, SEQUENTIAL_RAMP, type GridCell } from "@/lib/heatmap";
import type { Heatmap } from "@/lib/types";
import { useElementWidth } from "@/lib/useElementWidth";

export type HeatmapMode = "dots" | "grid";

export const CELL_SIZE = 40;

export function HeatmapCanvas({ heatmap, mode, showPage }: { heatmap: Heatmap; mode: HeatmapMode; showPage: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const [hovered, setHovered] = useState<GridCell | null>(null);
  const cells = useMemo(() => bucketClicks(heatmap.clicks, CELL_SIZE), [heatmap.clicks]);

  const pageWidth = heatmap.viewport_width;
  const pageHeight = heatmap.page_height;
  const scale = width > 0 ? width / pageWidth : 0;
  const radius = scale > 0 ? Math.max(6, 5 / scale) : 6;
  const max = cells.reduce((top, cell) => Math.max(top, cell.count), 0);

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative w-full overflow-hidden rounded-lg border border-border bg-white"
        style={{ height: scale > 0 ? pageHeight * scale : undefined, aspectRatio: scale > 0 ? undefined : `${pageWidth} / ${pageHeight}` }}
        onMouseLeave={() => setHovered(null)}
      >
        {showPage && (
          <iframe
            src={heatmap.url}
            title="Page preview"
            sandbox=""
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 origin-top-left border-0 opacity-60"
            style={{ width: pageWidth, height: pageHeight, transform: `scale(${scale || 1})` }}
          />
        )}
        <svg
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          role="img"
          aria-label={`${plural(heatmap.clicks.length, "click")} on ${heatmap.url}`}
        >
          {mode === "dots"
            ? heatmap.clicks.map((click, index) => (
                <circle
                  key={index}
                  data-testid="click-dot"
                  cx={click.x}
                  cy={click.y}
                  r={radius}
                  fill="var(--dot)"
                  fillOpacity={0.45}
                  stroke="var(--dot-ring)"
                  strokeWidth={scale > 0 ? 1 / scale : 1}
                />
              ))
            : cells.map((cell) => (
                <rect
                  key={`${cell.col}:${cell.row}`}
                  data-testid="click-cell"
                  x={cell.col * CELL_SIZE + 1}
                  y={cell.row * CELL_SIZE + 1}
                  width={CELL_SIZE - 2}
                  height={CELL_SIZE - 2}
                  rx={4}
                  fill={heatColor(cell.intensity)}
                  fillOpacity={0.8}
                  onMouseEnter={() => setHovered(cell)}
                >
                  <title>{plural(cell.count, "click")}</title>
                </rect>
              ))}
        </svg>
        {mode === "grid" && hovered && scale > 0 && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 rounded-md bg-text px-2 py-1 text-xs font-medium whitespace-nowrap text-bg shadow"
            style={{
              left: (hovered.col + 0.5) * CELL_SIZE * scale,
              top: hovered.row * CELL_SIZE * scale - 6,
              transform: "translate(-50%, -100%)",
            }}
          >
            {plural(hovered.count, "click")}
          </div>
        )}
      </div>

      {mode === "grid" ? (
        <div className="flex items-center gap-2 text-xs text-muted" aria-label="Legend">
          <span>Fewer clicks</span>
          <span className="flex gap-0.5">
            {SEQUENTIAL_RAMP.map((color) => (
              <span key={color} className="h-3 w-5 rounded-sm" style={{ background: color }} />
            ))}
          </span>
          <span>More ({plural(max, "click")} per {CELL_SIZE}px cell)</span>
        </div>
      ) : (
        <p className="text-xs text-muted">Each dot is one click. Darker areas are where dots overlap.</p>
      )}
    </div>
  );
}

export function Hotspots({ heatmap }: { heatmap: Heatmap }) {
  const top = useMemo(
    () =>
      bucketClicks(heatmap.clicks, CELL_SIZE * 2)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [heatmap.clicks],
  );
  if (top.length === 0) return null;
  return (
    <section className="card p-4" aria-labelledby="hotspots-heading">
      <h2 id="hotspots-heading" className="mb-2 font-semibold">
        Top click areas
      </h2>
      <ol className="space-y-2.5">
        {top.map((cell) => (
          <li key={`${cell.col}:${cell.row}`}>
            <div className="font-medium tabular-nums">{plural(cell.count, "click")}</div>
            <div className="font-mono text-xs text-muted tabular-nums">
              x {cell.col * CELL_SIZE * 2} to {(cell.col + 1) * CELL_SIZE * 2}, y {cell.row * CELL_SIZE * 2} to{" "}
              {(cell.row + 1) * CELL_SIZE * 2}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
