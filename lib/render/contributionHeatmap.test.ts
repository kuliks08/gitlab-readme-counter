import { describe, it, expect, vi, afterEach } from "vitest";
import {
  HEATMAP_DISPLAY_WEEKS,
  buildContributionHeatmap,
  contributionLevel,
  maxHeatmapCount,
} from "./contributionHeatmap";

describe("contributionHeatmap", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("contributionLevel границы по доле от max", () => {
    expect(contributionLevel(0, 10)).toBe(0);
    expect(contributionLevel(2, 10)).toBe(1);
    expect(contributionLevel(3, 10)).toBe(2);
    expect(contributionLevel(5, 10)).toBe(3);
    expect(contributionLevel(10, 10)).toBe(4);
  });

  it("buildContributionHeatmap заполняет сетку и подхватывает byDate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const byDate = { "2025-06-10": 5 };
    const cols = buildContributionHeatmap(byDate, 4);

    expect(cols).toHaveLength(4);
    expect(cols.every((c) => c.length === 7)).toBe(true);

    const flat = cols.flat();
    const hit = flat.find((d) => d.dateKey === "2025-06-10");
    expect(hit?.count).toBe(5);
  });

  it("maxHeatmapCount игнорирует будущие ячейки", () => {
    const cols = [
      [
        { dateKey: "x", count: 9, isFuture: false },
        { dateKey: "y", count: 3, isFuture: true },
      ],
    ];
    expect(maxHeatmapCount(cols)).toBe(9);
  });

  it("HEATMAP_DISPLAY_WEEKS разумный для вёрстки", () => {
    expect(HEATMAP_DISPLAY_WEEKS).toBeGreaterThanOrEqual(12);
    expect(HEATMAP_DISPLAY_WEEKS).toBeLessThanOrEqual(53);
  });
});
