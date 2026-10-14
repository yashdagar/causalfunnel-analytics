import { describe, expect, it } from "vitest";

import { displayPath, formatDuration, formatOffset, formatRelative, plural, shortId } from "../format";

describe("formatDuration", () => {
  it("shows seconds, minutes and hours at the right granularity", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(42_400)).toBe("42s");
    expect(formatDuration(125_000)).toBe("2m 5s");
    expect(formatDuration(3_780_000)).toBe("1h 3m");
  });
});

describe("formatOffset", () => {
  it("formats time since the session started as +m:ss", () => {
    expect(formatOffset(0)).toBe("+0:00");
    expect(formatOffset(65_900)).toBe("+1:05");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");

  it("describes recent times relative to now", () => {
    expect(formatRelative("2026-10-14T11:59:40.000Z", now)).toBe("just now");
    expect(formatRelative("2026-10-14T11:55:00.000Z", now)).toBe("5m ago");
    expect(formatRelative("2026-10-14T09:00:00.000Z", now)).toBe("3h ago");
    expect(formatRelative("2026-10-12T12:00:00.000Z", now)).toBe("2d ago");
  });
});

describe("displayPath", () => {
  it("drops the protocol", () => {
    expect(displayPath("https://shop.test/demo/shop.html")).toBe("shop.test/demo/shop.html");
  });

  it("returns invalid URLs unchanged", () => {
    expect(displayPath("not a url")).toBe("not a url");
  });
});

describe("shortId and plural", () => {
  it("shortens ids and pluralizes counts", () => {
    expect(shortId("3f2a9c1e-0000-4000")).toBe("3f2a9c1e");
    expect(plural(1, "click")).toBe("1 click");
    expect(plural(1200, "click")).toBe("1,200 clicks");
  });
});
