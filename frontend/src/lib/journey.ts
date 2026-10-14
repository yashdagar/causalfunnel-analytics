import type { TrackedEvent } from "./types";

export interface JourneyStep {
  view: TrackedEvent | null;
  clicks: TrackedEvent[];
}

export function groupJourney(events: TrackedEvent[]): JourneyStep[] {
  const steps: JourneyStep[] = [];
  for (const event of events) {
    if (event.type === "page_view") {
      steps.push({ view: event, clicks: [] });
      continue;
    }
    const current = steps[steps.length - 1];
    if (current && (current.view === null || current.view.url === event.url)) current.clicks.push(event);
    else steps.push({ view: null, clicks: [event] });
  }
  return steps;
}

export function describeTarget(event: TrackedEvent): string {
  const target = event.target;
  if (!target || ((target.tag === "html" || target.tag === "body") && !target.id)) return "Clicked the page";
  const label = target.text ? `"${target.text}"` : target.id ? `#${target.id}` : null;
  const kind = { a: "link", button: "button", input: "input", select: "select", textarea: "text area" }[target.tag] ?? target.tag;
  return label ? `Clicked ${kind} ${label}` : `Clicked ${kind}`;
}
