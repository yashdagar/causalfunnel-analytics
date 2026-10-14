"use client";

import { Flame } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useDemoUrl } from "@/components/layout/DemoLink";
import { cn } from "@/components/ui/cn";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { displayPath, plural } from "@/lib/format";
import { useHeatmap, usePages } from "@/lib/queries";
import type { Device } from "@/lib/types";

import { HeatmapCanvas, Hotspots, type HeatmapMode } from "./HeatmapCanvas";

const DEVICES: { value: Device; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

function parseDevice(value: string | null): Device {
  return value === "mobile" || value === "tablet" ? value : "desktop";
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-border-strong p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 font-medium whitespace-nowrap",
            option.value === value ? "bg-brand-soft text-brand-text" : "text-muted hover:text-text",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function HeatmapExplorer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const demoUrl = useDemoUrl();
  const [showPage, setShowPage] = useState(true);

  const pages = usePages();
  const selectedUrl = searchParams.get("url") ?? pages.data?.pages[0]?.url ?? null;
  const device = parseDevice(searchParams.get("device"));
  const mode: HeatmapMode = searchParams.get("mode") === "grid" ? "grid" : "dots";
  const heatmap = useHeatmap(selectedUrl, device);

  function update(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedUrl && !params.has("url")) params.set("url", selectedUrl);
    for (const [key, value] of Object.entries(changes)) params.set(key, value);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  if (pages.error && !pages.data) return <ErrorState message={pages.error.message} onRetry={() => pages.mutate()} />;

  if (pages.data && pages.data.pages.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<Flame className="size-6" />} title="No pages tracked yet">
          Open the{" "}
          <a href={demoUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-text underline">
            demo store
          </a>{" "}
          and click around to build a heatmap.
        </EmptyState>
      </div>
    );
  }

  const pageOptions = pages.data?.pages ?? [];
  const knownUrl = pageOptions.some((page) => page.url === selectedUrl);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <h1 className="text-base font-semibold">Click heatmap</h1>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Page</span>
            <select
              aria-label="Page"
              value={selectedUrl ?? ""}
              onChange={(event) => update({ url: event.target.value })}
              className="h-9 w-full rounded-lg border border-border-strong bg-surface px-2"
              disabled={!pages.data}
            >
              {!knownUrl && selectedUrl && <option value={selectedUrl}>{displayPath(selectedUrl)}</option>}
              {pageOptions.map((page) => (
                <option key={page.url} value={page.url}>
                  {displayPath(page.url)} ({plural(page.clicks, "click")})
                </option>
              ))}
            </select>
          </label>
        </div>
        <Segmented
          label="Device"
          value={device}
          onChange={(value) => update({ device: value })}
          options={DEVICES.map(({ value, label }) => ({
            value,
            label: (
              <>
                {label}
                {heatmap.data && <span className="ml-1.5 text-xs text-subtle tabular-nums">{heatmap.data.devices[value]}</span>}
              </>
            ),
          }))}
        />
        <Segmented
          label="Display"
          value={mode}
          onChange={(value) => update({ mode: value })}
          options={[
            { value: "dots", label: "Dots" },
            { value: "grid", label: "Grid" },
          ]}
        />
        <label className="flex h-9 items-center gap-2 text-muted">
          <input type="checkbox" checked={showPage} onChange={(event) => setShowPage(event.target.checked)} />
          Show page
        </label>
      </div>

      {heatmap.error && !heatmap.data ? (
        <ErrorState message={heatmap.error.message} onRetry={() => heatmap.mutate()} />
      ) : !heatmap.data ? (
        <Skeleton className="h-[480px]" />
      ) : heatmap.data.total === 0 ? (
        <div className="card">
          <EmptyState icon={<Flame className="size-6" />} title={`No ${device} clicks on this page`}>
            Try another device class, or click around this page at a {device} window width.
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="card space-y-3 p-4">
            <p className="text-muted">
              {plural(heatmap.data.total, "click")} on {device}, drawn at {heatmap.data.viewport_width}px wide
              {heatmap.data.total > heatmap.data.clicks.length && ` (latest ${heatmap.data.clicks.length.toLocaleString()} shown)`}
            </p>
            <HeatmapCanvas heatmap={heatmap.data} mode={mode} showPage={showPage} />
          </div>
          <div>
            <Hotspots heatmap={heatmap.data} />
          </div>
        </div>
      )}
    </div>
  );
}
