import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { journey } from "@/test/fixtures";
import { mockApi, renderWithSWR } from "@/test/utils";

import { SessionJourney } from "../sessions/SessionJourney";

const ID = "3f2a9c1e-0000-4000-8000-000000000001";

describe("SessionJourney", () => {
  it("shows the session totals", async () => {
    mockApi({ [`/sessions/${ID}/events`]: journey() });

    renderWithSWR(<SessionJourney id={ID} />);

    expect(await screen.findByText("User journey")).toBeInTheDocument();
    expect(screen.getByText("Events").nextSibling).toHaveTextContent("4");
    expect(screen.getByText("Page views").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Duration").nextSibling).toHaveTextContent("2m 5s");
  });

  it("lists page views in order with the clicks made on each page", async () => {
    mockApi({ [`/sessions/${ID}/events`]: journey() });

    renderWithSWR(<SessionJourney id={ID} />);

    const timeline = await screen.findByRole("list", { name: "Events in order" });
    const steps = within(timeline).getAllByRole("listitem").filter((item) => item.parentElement === timeline);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toHaveTextContent("Viewed shop.test/demo/");
    expect(steps[0]).toHaveTextContent('Clicked button "Add to cart"');
    expect(steps[0]).toHaveTextContent("(120, 480)");
    expect(steps[1]).toHaveTextContent("+1:00");
    expect(steps[1]).toHaveTextContent("Viewed shop.test/demo/shop.html");
    expect(steps[1]).toHaveTextContent('Clicked link "Go to checkout"');
    expect(steps[1]).toHaveTextContent("+2:05");
  });

  it("says when a session does not exist", async () => {
    mockApi({ [`/sessions/${ID}/events`]: new Response(JSON.stringify({ detail: "Session not found" }), { status: 404 }) });

    renderWithSWR(<SessionJourney id={ID} />);

    expect(await screen.findByText("Session not found")).toBeInTheDocument();
  });
});
