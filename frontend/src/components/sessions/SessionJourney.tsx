"use client";

import { ArrowLeft, FileText, MousePointerClick } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { displayPath, formatDateTime, formatDuration, formatOffset, plural } from "@/lib/format";
import { describeTarget, groupJourney } from "@/lib/journey";
import { useSessionJourney } from "@/lib/queries";

import { DeviceIcon } from "./DeviceIcon";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/sessions" className="mb-3 inline-flex items-center gap-1 text-muted hover:text-text lg:hidden">
      <ArrowLeft className="size-4" />
      All sessions
    </Link>
  );
}

export function SessionJourney({ id }: { id: string }) {
  const { data, error, isLoading, mutate } = useSessionJourney(id);

  if (error && !data) {
    return (
      <div className="card">
        <div className="p-4 pb-0">
          <BackLink />
        </div>
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState title="Session not found">This session has no recorded events.</EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        )}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="card space-y-4 p-5" aria-label="Loading session">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { session, events } = data;
  const start = new Date(session.first_seen).getTime();
  const steps = groupJourney(events);

  return (
    <article className="card p-5" aria-labelledby="journey-heading">
      <BackLink />
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="journey-heading" className="text-base font-semibold">
            User journey
          </h2>
          <p className="break-all font-mono text-xs text-muted">{session.session_id}</p>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <DeviceIcon device={session.device} className="size-4" />
          <span>{formatDateTime(session.first_seen)}</span>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Events" value={session.event_count.toLocaleString()} />
        <Stat label="Page views" value={session.page_views.toLocaleString()} />
        <Stat label="Clicks" value={session.clicks.toLocaleString()} />
        <Stat label="Duration" value={formatDuration(session.duration_ms)} />
      </div>

      <ol className="mt-6 space-y-4" aria-label="Events in order">
        {steps.map((step, index) => (
          <li key={step.view?.id ?? step.clicks[0].id} className="relative pl-8">
            {index < steps.length - 1 && <span className="absolute top-7 bottom-[-16px] left-[11px] w-px bg-border-strong" />}
            <span className="absolute top-0.5 left-0 grid size-6 place-items-center rounded-full bg-brand-soft text-brand-text">
              <FileText className="size-3.5" />
            </span>
            {step.view ? (
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-xs text-subtle tabular-nums">
                  {formatOffset(new Date(step.view.timestamp).getTime() - start)}
                </span>
                <span className="font-medium">Viewed {displayPath(step.view.url)}</span>
                {step.view.title && <span className="text-muted">{step.view.title}</span>}
              </div>
            ) : (
              <div className="font-medium text-muted">Clicks on {displayPath(step.clicks[0].url)}</div>
            )}
            {step.clicks.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {step.clicks.map((click) => (
                  <li key={click.id} className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-subtle tabular-nums">
                      {formatOffset(new Date(click.timestamp).getTime() - start)}
                    </span>
                    <MousePointerClick className="size-3.5 shrink-0 translate-y-0.5 text-subtle" />
                    <span className="min-w-0 break-words">{describeTarget(click)}</span>
                    <span className="ml-auto shrink-0 font-mono text-xs text-subtle tabular-nums">
                      ({click.x}, {click.y})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <footer className="mt-6 border-t border-border pt-3 text-xs text-subtle">
        {plural(events.length, "event")} · entered on {displayPath(session.entry_url)}
        {session.user_agent && <div className="mt-1 truncate">{session.user_agent}</div>}
      </footer>
    </article>
  );
}
