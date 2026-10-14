import { describe, expect, it } from "vitest";

import { mockApi } from "@/test/utils";

import { ApiError, api } from "../api";

describe("api", () => {
  it("builds query strings for the heatmap", async () => {
    const mock = mockApi({ "/heatmap": { clicks: [] } });

    await api.heatmap("https://shop.test/demo/?a=1", "mobile");

    expect(mock.calls[0]).toBe("/heatmap?url=https%3A%2F%2Fshop.test%2Fdemo%2F%3Fa%3D1&device=mobile");
  });

  it("encodes session ids in the path", async () => {
    const mock = mockApi({ "/sessions/a%2Fb/events": { session: {}, events: [] } });

    await api.sessionEvents("a/b");

    expect(mock.calls[0]).toBe("/sessions/a%2Fb/events");
  });

  it("throws an ApiError with the server's detail message", async () => {
    mockApi({ "/sessions/x/events": new Response(JSON.stringify({ detail: "Session not found" }), { status: 404 }) });

    const error = await api.sessionEvents("x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: "Session not found" });
  });
});
