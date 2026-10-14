import { vi } from "vitest";

export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() };

export const navigationState = {
  searchParams: new URLSearchParams(),
  pathname: "/sessions",
  params: {} as Record<string, string>,
};

export function setSearchParams(value: string) {
  navigationState.searchParams = new URLSearchParams(value);
}

export function resetNavigation() {
  navigationState.searchParams = new URLSearchParams();
  navigationState.pathname = "/sessions";
  navigationState.params = {};
}
