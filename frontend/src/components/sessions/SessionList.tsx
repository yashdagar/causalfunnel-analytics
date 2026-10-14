"use client";

import { ChevronLeft, ChevronRight, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useDemoUrl } from "@/components/layout/DemoLink";
import { cn } from "@/components/ui/cn";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { displayPath, formatDuration, formatRelative, plural, shortId } from "@/lib/format";
import { useSessions } from "@/lib/queries";

import { DeviceIcon } from "./DeviceIcon";

const PAGE_SIZE = 20;

export function SessionList({ selectedId }: { selectedId?: string }) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSessions(page, PAGE_SIZE);
  const demoUrl = useDemoUrl();

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden" aria-labelledby="sessions-heading">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h1 id="sessions-heading" className="text-base font-semibold">
          Sessions
        </h1>
        {data && <span className="text-muted">{plural(total, "session")}</span>}
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <div className="space-y-3 p-4" aria-label="Loading sessions">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data && data.sessions.length === 0 ? (
        <EmptyState icon={<MousePointerClick className="size-6" />} title="No sessions yet">
          Open the{" "}
          <a href={demoUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-text underline">
            demo store
          </a>{" "}
          and click around. Sessions show up here within a few seconds.
        </EmptyState>
      ) : (
        <ul className="scrollbar-thin min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {data?.sessions.map((session) => {
            const active = session.session_id === selectedId;
            return (
              <li key={session.session_id}>
                <Link
                  href={`/sessions/${encodeURIComponent(session.session_id)}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    active ? "bg-brand-soft" : "hover:bg-surface-hover",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium">{shortId(session.session_id)}</span>
                      <DeviceIcon device={session.device} className="size-3.5 text-subtle" />
                      <span className="text-subtle">{formatRelative(session.last_seen)}</span>
                    </div>
                    <div className="truncate text-muted">{displayPath(session.entry_url)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{plural(session.event_count, "event")}</div>
                    <div className="text-subtle tabular-nums">{formatDuration(session.duration_ms)}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-muted">
          <span className="tabular-nums">
            {from} to {to} of {total}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="grid size-8 place-items-center rounded-md hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="grid size-8 place-items-center rounded-md hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
