/** Декодирование custom_title из query (как в /api). */
export function parseCustomTitle(sp: URLSearchParams): string | null {
  const raw = sp.get("custom_title");
  if (raw === null || raw.trim() === "") {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
