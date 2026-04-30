import { describe, expect, it } from "vitest";
import {
  mergeLanguageMaps,
  normalizePercents,
  takeTop,
} from "./topLanguages";

describe("mergeLanguageMaps", () => {
  it("суммирует байты по одному ключу из двух карт", () => {
    const a = { TypeScript: 1000, Rust: 200 };
    const b = { TypeScript: 500, Python: 300 };
    expect(mergeLanguageMaps([a, b])).toEqual({
      TypeScript: 1500,
      Rust: 200,
      Python: 300,
    });
  });

  it("игнорирует нечисловые и нефинитные значения", () => {
    const broken = {
      A: 10,
      B: Number.NaN,
      C: Number.POSITIVE_INFINITY,
      D: Number.NEGATIVE_INFINITY,
    } as Record<string, number>;
    expect(mergeLanguageMaps([broken, { A: 5, E: 7 }])).toEqual({
      A: 15,
      E: 7,
    });
  });
});

describe("normalizePercents", () => {
  it("сортирует по убыванию и даёт сумму долей ≈ 100%", () => {
    const weights = { a: 10, b: 30, c: 60 };
    const rows = normalizePercents(weights);
    expect(rows.map((r) => r.lang)).toEqual(["c", "b", "a"]);
    const total = rows.reduce((s, r) => s + r.percent, 0);
    expect(total).toBeCloseTo(100, 10);
  });

  it("при сумме ≤ 0 возвращает пустой массив", () => {
    expect(normalizePercents({})).toEqual([]);
    expect(normalizePercents({ x: 0, y: 0 })).toEqual([]);
    expect(normalizePercents({ x: -5, y: 5 })).toEqual([]);
  });
});

describe("takeTop", () => {
  const entries = Array.from({ length: 25 }, (_, i) => ({
    lang: `L${i}`,
    percent: 25 - i,
  }));

  it("обрезает по n", () => {
    expect(takeTop(entries, 3)).toHaveLength(3);
    expect(takeTop(entries, 3).map((e) => e.lang)).toEqual(["L0", "L1", "L2"]);
  });

  it("не больше 20 элементов", () => {
    expect(takeTop(entries, 100)).toHaveLength(20);
    expect(takeTop(entries, 20)).toHaveLength(20);
  });

  it("отрицательное и NaN дают пустой срез; +Infinity — ровно 20", () => {
    expect(takeTop(entries, -1)).toEqual([]);
    expect(takeTop(entries, Number.NaN)).toEqual([]);
    expect(takeTop(entries, Number.POSITIVE_INFINITY)).toHaveLength(20);
  });

  it("дробное n обрезается вниз", () => {
    expect(takeTop(entries, 3.9)).toHaveLength(3);
  });
});
