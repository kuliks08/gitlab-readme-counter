import { describe, it, expect } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("tokyonight: bg_color как в апстриме GRS", () => {
    expect(resolveTheme("tokyonight").bg_color).toBe("1a1b27");
  });

  it("default theme: палитра из апстрима", () => {
    const d = resolveTheme("default");
    expect(d.title_color).toBe("2f80ed");
    expect(d.icon_color).toBe("4c71f2");
    expect(d.text_color).toBe("434d58");
    expect(d.bg_color).toBe("fffefe");
    expect(d.border_color).toBe("e4e2e2");
  });

  it("неизвестная тема — fallback на default", () => {
    expect(resolveTheme("no-such-theme")).toEqual(resolveTheme("default"));
  });
});
