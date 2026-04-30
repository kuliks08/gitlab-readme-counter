/**
 * Общие query-параметры для карточек (паритет с github-readme-stats по смыслу).
 */

export function pickUsername(sp: URLSearchParams): string | null {
  const u = sp.get("username") ?? sp.get("user");
  const trimmed = u?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function parseBool(
  sp: URLSearchParams,
  key: string,
  defaultVal: boolean,
): boolean {
  const raw = sp.get(key);
  if (raw === null || raw.trim() === "") return defaultVal;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return defaultVal;
}

export function pickTheme(sp: URLSearchParams): string {
  const t = sp.get("theme")?.trim();
  if (!t) return "default";
  return t.toLowerCase();
}
