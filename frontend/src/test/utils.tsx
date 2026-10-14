import { render } from "@testing-library/react";
import { SWRConfig } from "swr";
import { vi } from "vitest";

import { swrFetcher } from "@/lib/queries";

type Handler = (url: URL) => unknown;

export interface MockApi {
  calls: string[];
}

export function mockApi(routes: Record<string, Handler | unknown>): MockApi {
  const api: MockApi = { calls: [] };
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api/, "");
    api.calls.push(`${path}${url.search}`);
    const key = [`${path}${url.search}`, path].find((k) => k in routes);
    if (!key) return new Response(JSON.stringify({ detail: `No mock for ${path}` }), { status: 500 });
    const route = routes[key];
    const result = typeof route === "function" ? (route as Handler)(url) : route;
    if (result instanceof Response) return result;
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  return api;
}

export function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ fetcher: swrFetcher, provider: () => new Map(), dedupingInterval: 0, refreshInterval: 0 }}>
      {ui}
    </SWRConfig>,
  );
}
