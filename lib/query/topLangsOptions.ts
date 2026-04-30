export type TopLangLayout = "normal" | "compact";

export function parseTopLangLayout(sp: URLSearchParams): TopLangLayout {
  const raw = sp.get("layout")?.trim() ?? "normal";
  return raw === "compact" ? "compact" : "normal";
}

export function parseLangsCount(sp: URLSearchParams): number {
  const raw = sp.get("langs_count") ?? sp.get("langs") ?? "10";
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return 10;
  return Math.min(20, Math.max(1, n));
}
