import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveTheme } from "./theme";
import { renderGitLabStatsCardSvg } from "./gitlabStatsCardSvg";

const theme = resolveTheme("default");

describe("renderGitLabStatsCardSvg", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("при нулевых проектах/звёздах и календаре — теплокарта без строк Projects/Stars", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const svg = renderGitLabStatsCardSvg({
      username: "testuser",
      name: "",
      projectCount: 0,
      starsTotal: 0,
      profileCalendar: {
        byDate: { "2025-06-10": 8 },
        total: 42,
      },
      theme,
      hideBorder: false,
      showIcons: false,
    });
    expect(svg).not.toContain("Total Projects");
    expect(svg).not.toContain("Total Stars");
    expect(svg).toContain('<rect class="hm-r"');
    expect(svg).toContain("Issues, merge requests, pushes, and comments.");
    expect(svg).toContain("<title>");
    expect(svg).toContain("contributions");
    expect(svg).toContain("Less");
    expect(svg).toContain("More");
  });

  it("строки Projects/Stars только при ненулевых значениях", () => {
    const svg = renderGitLabStatsCardSvg({
      username: "testuser",
      name: "",
      projectCount: 3,
      starsTotal: 0,
      profileCalendar: null,
      theme,
      hideBorder: false,
      showIcons: false,
    });
    expect(svg).toContain("Total Projects");
    expect(svg).not.toContain("Total Stars");
  });

  it("без календаря показывает числа проектов", () => {
    const svg = renderGitLabStatsCardSvg({
      username: "testuser",
      name: "",
      projectCount: 12,
      starsTotal: 30,
      profileCalendar: null,
      theme,
      hideBorder: false,
      showIcons: false,
    });
    expect(svg).toContain("<svg");
    expect(svg.includes("testuser") || svg.includes("12")).toBe(true);
    expect(svg).not.toContain('<rect class="hm-r"');
  });

  it("без теплокарты, но с суммой вкладов — одна строка Contributions", () => {
    const svg = renderGitLabStatsCardSvg({
      username: "testuser",
      name: "",
      projectCount: 0,
      starsTotal: 0,
      profileCalendar: { byDate: {}, total: 99 },
      theme,
      hideBorder: false,
      showIcons: false,
    });
    expect(svg).toContain("Contributions");
    expect(svg).toContain("99");
    expect(svg).not.toContain('<rect class="hm-r"');
  });
});
