import { describe, expect, it } from "vitest";

import { event } from "@/test/fixtures";

import { describeTarget, groupJourney } from "../journey";

describe("groupJourney", () => {
  it("nests clicks under the page view they happened on", () => {
    const home = event();
    const click = event({ type: "click" });
    const shop = event({ url: "https://shop.test/demo/shop.html" });

    expect(groupJourney([home, click, shop])).toEqual([
      { view: home, clicks: [click] },
      { view: shop, clicks: [] },
    ]);
  });

  it("starts a separate step for clicks without a matching page view", () => {
    const orphan = event({ type: "click", url: "https://shop.test/demo/checkout.html" });
    const home = event();

    const steps = groupJourney([home, orphan]);

    expect(steps).toEqual([
      { view: home, clicks: [] },
      { view: null, clicks: [orphan] },
    ]);
  });
});

describe("describeTarget", () => {
  it("names the kind of element and its label", () => {
    expect(describeTarget(event({ type: "click", target: { tag: "button", text: "Add to cart" } }))).toBe(
      'Clicked button "Add to cart"',
    );
    expect(describeTarget(event({ type: "click", target: { tag: "a", id: "nav" } }))).toBe("Clicked link #nav");
  });

  it("treats clicks on the document itself as clicks on the page", () => {
    expect(describeTarget(event({ type: "click", target: { tag: "html" } }))).toBe("Clicked the page");
    expect(describeTarget(event({ type: "click", target: null }))).toBe("Clicked the page");
  });
});
