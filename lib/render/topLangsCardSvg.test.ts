import { describe, it, expect } from "vitest";
import { resolveTheme } from "./theme";
import { renderTopLangsSvg } from "./topLangsCardSvg";

const theme = resolveTheme("default");

describe("renderTopLangsSvg", () => {
  it("non-empty: содержит svg, название языка и процент", () => {
    const svg = renderTopLangsSvg({
      title: "Top Langs",
      entries: [
        { lang: "JavaScript", percent: 42.5 },
        { lang: "Python", percent: 30 },
      ],
      layout: "compact",
      theme,
      hideBorder: false,
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("JavaScript");
    expect(svg).toContain("%");
  });

  it("layout normal: содержит svg и процент для записей", () => {
    const svg = renderTopLangsSvg({
      title: "Langs",
      entries: [{ lang: "Rust", percent: 100 }],
      layout: "normal",
      theme,
      hideBorder: true,
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("Rust");
    expect(svg).toContain("%");
  });
});
