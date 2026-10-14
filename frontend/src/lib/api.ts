import type { Device, Heatmap, SessionJourney, SessionPage, TrackedPage } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.detail === "string" ? body.detail : `Request failed (${response.status})`;
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

export const paths = {
  sessions: (page = 1, limit = 20) => `/sessions?page=${page}&limit=${limit}`,
  sessionEvents: (id: string) => `/sessions/${encodeURIComponent(id)}/events`,
  pages: () => "/pages",
  heatmap: (url: string, device: Device) => `/heatmap?${new URLSearchParams({ url, device })}`,
};

export const api = {
  sessions: (page?: number, limit?: number) => request<SessionPage>(paths.sessions(page, limit)),
  sessionEvents: (id: string) => request<SessionJourney>(paths.sessionEvents(id)),
  pages: () => request<{ pages: TrackedPage[] }>(paths.pages()),
  heatmap: (url: string, device: Device) => request<Heatmap>(paths.heatmap(url, device)),
};
