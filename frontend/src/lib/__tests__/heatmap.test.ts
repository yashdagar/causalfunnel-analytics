import { describe, expect, it } from "vitest";

import { bucketClicks, heatColor, SEQUENTIAL_RAMP } from "../heatmap";

describe("bucketClicks", () => {
  it("counts clicks per grid cell and scales intensity to the busiest cell", () => {
    const cells = bucketClicks(
      [
        { x: 5, y: 5 },
        { x: 39, y: 39 },
        { x: 41, y: 0 },
        { x: 0, y: 80 },
      ],
      40,
    );

    expect(cells).toEqual([
      { col: 0, row: 0, count: 2, intensity: 1 },
      { col: 1, row: 0, count: 1, intensity: 0.5 },
      { col: 0, row: 2, count: 1, intensity: 0.5 },
    ]);
  });

  it("returns no cells for no clicks", () => {
    expect(bucketClicks([], 40)).toEqual([]);
  });
});

describe("heatColor", () => {
  it("goes from the lightest to the darkest step of one hue", () => {
    expect(heatColor(0)).toBe(SEQUENTIAL_RAMP[0]);
    expect(heatColor(1)).toBe(SEQUENTIAL_RAMP[SEQUENTIAL_RAMP.length - 1]);
    expect(heatColor(5)).toBe(SEQUENTIAL_RAMP[SEQUENTIAL_RAMP.length - 1]);
  });
});
