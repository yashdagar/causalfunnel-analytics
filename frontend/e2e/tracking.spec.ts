import { expect, test, type Page } from "@playwright/test";

import { API_ORIGIN } from "../playwright.config";

async function browseDemoStore(page: Page): Promise<string> {
  await page.goto(`${API_ORIGIN}/demo/`);
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.getByRole("link", { name: "Shop the roasts" }).click();
  await page.waitForURL(/shop\.html/);
  await page.getByRole("link", { name: "Go to checkout" }).click();
  await page.waitForURL(/checkout\.html/);
  await page.getByRole("button", { name: "Place order" }).click();
  const sessionId = await page.evaluate(() => {
    const tracker = (window as unknown as { CausalFunnel: { flush(): void; sessionId(): string } }).CausalFunnel;
    tracker.flush();
    return tracker.sessionId();
  });
  await expect
    .poll(async () => (await page.request.get(`${API_ORIGIN}/api/sessions/${sessionId}/events`)).ok())
    .toBe(true);
  return sessionId;
}

test("a visit to the demo store shows up as an ordered journey", async ({ page, context }) => {
  const shopper = await context.newPage();
  const sessionId = await browseDemoStore(shopper);

  await page.goto("/sessions");
  await page.getByRole("link", { name: new RegExp(sessionId.slice(0, 8)) }).click();

  await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}`));
  const timeline = page.getByRole("list", { name: "Events in order" });
  await expect(timeline.getByText(/^Viewed /)).toHaveText([
    /\/demo\/$/,
    /\/demo\/shop\.html$/,
    /\/demo\/checkout\.html$/,
  ]);
  await expect(timeline).toContainText('Clicked button "Add to cart"');
  await expect(timeline).toContainText('Clicked button "Place order"');
  await expect(page.getByText("Clicks", { exact: true }).locator("..")).toContainText("4");
});

test("clicks on a page are drawn on its heatmap", async ({ page, context }) => {
  const shopper = await context.newPage();
  await browseDemoStore(shopper);

  await page.goto("/heatmap");
  await page.getByRole("combobox", { name: "Page" }).selectOption(`${API_ORIGIN}/demo/checkout.html`);

  await expect(page.getByText(/clicks? on desktop, drawn at 1440px wide/)).toBeVisible();
  await expect(page.locator('[data-testid="click-dot"]').first()).toBeVisible();

  await page.getByRole("radio", { name: "Grid" }).click();
  await expect(page).toHaveURL(/mode=grid/);
  await expect(page.locator('[data-testid="click-cell"]').first()).toBeVisible();
});
