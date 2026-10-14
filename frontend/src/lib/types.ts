export type EventType = "page_view" | "click";
export type Device = "mobile" | "tablet" | "desktop";

export interface Session {
  session_id: string;
  first_seen: string;
  last_seen: string;
  duration_ms: number;
  event_count: number;
  page_views: number;
  clicks: number;
  entry_url: string;
  device: Device | null;
}

export interface SessionPage {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
}

export interface ClickTarget {
  tag: string;
  id?: string;
  text?: string;
}

export interface TrackedEvent {
  id: string;
  session_id: string;
  type: EventType;
  url: string;
  path: string;
  title: string | null;
  timestamp: string;
  x: number | null;
  y: number | null;
  target: ClickTarget | null;
  viewport: { width: number; height: number } | null;
}

export interface SessionJourney {
  session: Session & { user_agent: string | null };
  events: TrackedEvent[];
}

export interface TrackedPage {
  url: string;
  page_views: number;
  clicks: number;
  last_seen: string;
}

export interface Heatmap {
  url: string;
  device: Device;
  viewport_width: number;
  page_height: number;
  total: number;
  devices: Record<Device, number>;
  clicks: { x: number; y: number }[];
}
