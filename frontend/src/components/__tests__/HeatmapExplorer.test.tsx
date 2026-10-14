import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { heatmap } from "@/test/fixtures";
import { navigationState, router, setSearchParams } from "@/test/navigation";
import { mockApi, renderWithSWR } from "@/test/utils";

import { HeatmapExplorer } from "../heatmap/HeatmapExplorer";

const pages = {
  pages: [
    { url: "https://shop.test/demo/", page_views: 10, clicks: 30, last_seen: "2026-10-14T10:00:00.000Z" },
    { url: "https://shop.test/demo/shop.html", page_views: 4, clicks: 3, last_seen: "2026-10-14T10:00:00.000Z" },
  ],
};

describe("HeatmapExplorer", () => {
  it("opens the most clicked page and draws a dot per click", async () => {
    const mock = mockApi({ "/pages": pages, "/heatmap": heatmap() });
    navigationState.pathname = "/heatmap";

    renderWithSWR(<HeatmapExplorer />);

    expect(await screen.findAllByTestId("click-dot")).toHaveLength(3);
    expect(screen.getByRole("combobox", { name: "Page" })).toHaveValue("https://shop.test/demo/");
    expect(mock.calls).toContain("/heatmap?url=https%3A%2F%2Fshop.test%2Fdemo%2F&device=desktop");
    expect(screen.getByText("3 clicks on desktop, drawn at 1280px wide")).toBeInTheDocument();
  });

  it("loads the page chosen in the URL", async () => {
    setSearchParams("url=https://shop.test/demo/shop.html&device=mobile");
    const mock = mockApi({ "/pages": pages, "/heatmap": heatmap({ device: "mobile" }) });

    renderWithSWR(<HeatmapExplorer />);

    await screen.findAllByTestId("click-dot");
    expect(mock.calls).toContain("/heatmap?url=https%3A%2F%2Fshop.test%2Fdemo%2Fshop.html&device=mobile");
    expect(screen.getByRole("radio", { name: /Mobile/ })).toHaveAttribute("aria-checked", "true");
  });

  it("writes the selected page into the URL", async () => {
    mockApi({ "/pages": pages, "/heatmap": heatmap() });
    navigationState.pathname = "/heatmap";
    renderWithSWR(<HeatmapExplorer />);
    await screen.findAllByTestId("click-dot");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Page" }), "https://shop.test/demo/shop.html");

    expect(router.replace).toHaveBeenCalledWith("/heatmap?url=https%3A%2F%2Fshop.test%2Fdemo%2Fshop.html", { scroll: false });
  });

  it("switches device class through the URL and shows click counts per device", async () => {
    mockApi({ "/pages": pages, "/heatmap": heatmap() });
    navigationState.pathname = "/heatmap";
    renderWithSWR(<HeatmapExplorer />);
    await screen.findAllByTestId("click-dot");

    const mobile = screen.getByRole("radio", { name: /Mobile/ });
    expect(mobile).toHaveTextContent("1");
    await userEvent.click(mobile);

    expect(router.replace).toHaveBeenCalledWith("/heatmap?url=https%3A%2F%2Fshop.test%2Fdemo%2F&device=mobile", { scroll: false });
  });

  it("draws a density grid in grid mode", async () => {
    setSearchParams("mode=grid");
    mockApi({ "/pages": pages, "/heatmap": heatmap() });

    renderWithSWR(<HeatmapExplorer />);

    const cells = await screen.findAllByTestId("click-cell");
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent("2 clicks");
    expect(screen.queryByTestId("click-dot")).not.toBeInTheDocument();
  });

  it("lists the busiest click areas", async () => {
    mockApi({ "/pages": pages, "/heatmap": heatmap() });

    renderWithSWR(<HeatmapExplorer />);

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("2 clicks");
    expect(items[0]).toHaveTextContent("x 0 to 80, y 0 to 80");
  });

  it("renders the page underneath without letting it run scripts", async () => {
    mockApi({ "/pages": pages, "/heatmap": heatmap() });
    renderWithSWR(<HeatmapExplorer />);

    const frame = await screen.findByTitle("Page preview");
    expect(frame).toHaveAttribute("src", "https://shop.test/demo/");
    expect(frame).toHaveAttribute("sandbox", "");

    await userEvent.click(screen.getByRole("checkbox", { name: "Show page" }));
    expect(screen.queryByTitle("Page preview")).not.toBeInTheDocument();
  });

  it("explains when a device class has no clicks", async () => {
    setSearchParams("device=tablet");
    mockApi({ "/pages": pages, "/heatmap": heatmap({ device: "tablet", total: 0, clicks: [] }) });

    renderWithSWR(<HeatmapExplorer />);

    expect(await screen.findByText("No tablet clicks on this page")).toBeInTheDocument();
  });

  it("points to the demo store before any page is tracked", async () => {
    mockApi({ "/pages": { pages: [] } });

    renderWithSWR(<HeatmapExplorer />);

    expect(await screen.findByText("No pages tracked yet")).toBeInTheDocument();
  });
});
