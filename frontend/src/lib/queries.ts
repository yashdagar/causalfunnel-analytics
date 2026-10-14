import useSWR from "swr";
import { paths, request } from "./api";
import type { Device, Heatmap, SessionJourney, SessionPage, TrackedPage } from "./types";

export const swrFetcher = <T>(path: string) => request<T>(path);

const LIVE = { refreshInterval: 5000, keepPreviousData: true };

export function useSessions(page: number, limit = 20) {
  return useSWR<SessionPage>(paths.sessions(page, limit), LIVE);
}

export function useSessionJourney(id: string | null) {
  return useSWR<SessionJourney>(id ? paths.sessionEvents(id) : null, LIVE);
}

export function usePages() {
  return useSWR<{ pages: TrackedPage[] }>(paths.pages(), LIVE);
}

export function useHeatmap(url: string | null, device: Device) {
  return useSWR<Heatmap>(url ? paths.heatmap(url, device) : null, LIVE);
}
