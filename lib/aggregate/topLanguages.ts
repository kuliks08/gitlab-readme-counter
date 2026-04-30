export type LangBytes = Record<string, number>;

export function mergeLanguageMaps(maps: Record<string, number>[]): LangBytes {
  const out: LangBytes = {};
  for (const map of maps) {
    for (const [lang, raw] of Object.entries(map)) {
      if (!Number.isFinite(raw)) continue;
      out[lang] = (out[lang] ?? 0) + raw;
    }
  }
  return out;
}

export function normalizePercents(weights: LangBytes): {
  lang: string;
  percent: number;
}[] {
  let sum = 0;
  for (const w of Object.values(weights)) {
    if (Number.isFinite(w)) sum += w;
  }
  if (sum <= 0) return [];

  return Object.entries(weights)
    .filter(([, w]) => Number.isFinite(w))
    .map(([lang, w]) => ({ lang, percent: (w / sum) * 100 }))
    .sort((a, b) => b.percent - a.percent);
}

export function takeTop(
  entries: { lang: string; percent: number }[],
  n: number,
): { lang: string; percent: number }[] {
  if (Object.is(n, Number.POSITIVE_INFINITY)) {
    return entries.slice(0, 20);
  }
  if (!Number.isFinite(n) || n <= 0) {
    return entries.slice(0, 0);
  }
  const count = Math.min(Math.floor(n), 20);
  return entries.slice(0, count);
}
