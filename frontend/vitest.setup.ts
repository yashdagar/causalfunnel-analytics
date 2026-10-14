import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("next/navigation", async () => {
  const { router, navigationState } = await import("./src/test/navigation");
  return {
    useRouter: () => router,
    usePathname: () => navigationState.pathname,
    useSearchParams: () => navigationState.searchParams,
    useParams: () => navigationState.params,
    redirect: vi.fn(),
  };
});

afterEach(async () => {
  const { router, resetNavigation } = await import("./src/test/navigation");
  Object.values(router).forEach((fn) => fn.mockReset());
  resetNavigation();
});
