import type { ObjectId } from "mongodb";

export type EventType = "page_view" | "click";
export type Device = "mobile" | "tablet" | "desktop";

export interface Size {
  width: number;
  height: number;
}

export interface ClickTarget {
  tag: string;
  id?: string;
  text?: string;
}

export interface EventDoc {
  _id?: ObjectId;
  event_id: string;
  session_id: string;
  type: EventType;
  url: string;
  path: string;
  title?: string;
  referrer?: string;
  timestamp: Date;
  received_at: Date;
  x?: number;
  y?: number;
  target?: ClickTarget;
  viewport?: Size;
  document?: Size;
  device?: Device;
  user_agent?: string;
}

export interface SessionDoc {
  _id: string;
  first_seen: Date;
  last_seen: Date;
  event_count: number;
  page_views: number;
  clicks: number;
  entry_url: string;
  device?: Device;
  user_agent?: string;
}
