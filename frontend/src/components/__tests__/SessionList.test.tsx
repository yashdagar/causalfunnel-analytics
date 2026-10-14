import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { session } from "@/test/fixtures";
import { mockApi, renderWithSWR } from "@/test/utils";

import { SessionList } from "../sessions/SessionList";

function page(sessions: ReturnType<typeof session>[], total = sessions.length, number = 1) {
  return { sessions, total, page: number, limit: 20 };
}

describe("SessionList", () => {
  it("lists sessions with their total events, linking to each journey", async () => {
    mockApi({
      "/sessions": page([
        session({ session_id: "aaaaaaaa-1111", event_count: 12 }),
        session({ session_id: "bbbbbbbb-2222", event_count: 1, entry_url: "https://shop.test/demo/shop.html" }),
      ]),
    });

    renderWithSWR(<SessionList />);

    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/sessions/aaaaaaaa-1111");
    expect(within(links[0]).getByText("12 events")).toBeInTheDocument();
    expect(within(links[1]).getByText("1 event")).toBeInTheDocument();
    expect(within(links[1]).getByText("shop.test/demo/shop.html")).toBeInTheDocument();
    expect(screen.getByText("2 sessions")).toBeInTheDocument();
  });

  it("marks the selected session", async () => {
    mockApi({ "/sessions": page([session({ session_id: "aaaaaaaa-1111" }), session({ session_id: "bbbbbbbb-2222" })]) });

    renderWithSWR(<SessionList selectedId="bbbbbbbb-2222" />);

    const links = await screen.findAllByRole("link");
    expect(links[1]).toHaveAttribute("aria-current", "true");
    expect(links[0]).not.toHaveAttribute("aria-current");
  });

  it("pages through sessions", async () => {
    const mock = mockApi({
      "/sessions?page=1&limit=20": page([session({ session_id: "page-one-session" })], 25, 1),
      "/sessions?page=2&limit=20": page([session({ session_id: "page-two-session" })], 25, 2),
    });
    renderWithSWR(<SessionList />);
    await screen.findByText("page-one");

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("page-two")).toBeInTheDocument();
    expect(screen.getByText("21 to 25 of 25")).toBeInTheDocument();
    expect(mock.calls).toContain("/sessions?page=2&limit=20");
  });

  it("points to the demo store when there are no sessions", async () => {
    mockApi({ "/sessions": page([]) });

    renderWithSWR(<SessionList />);

    expect(await screen.findByText("No sessions yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "demo store" })).toHaveAttribute("href", "http://localhost:4000/demo/");
  });

  it("shows an error with a retry button when the API fails", async () => {
    mockApi({ "/sessions": new Response(JSON.stringify({ detail: "Database unavailable" }), { status: 500 }) });

    renderWithSWR(<SessionList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
