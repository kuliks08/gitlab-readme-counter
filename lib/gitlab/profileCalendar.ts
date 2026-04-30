import { GITLAB_API_BASE } from "./constants";

/** Origin веб-интерфейса (calendar.json не входит в REST api/v4). */
export function gitlabWebOrigin(): string {
  return new URL(GITLAB_API_BASE).origin;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Разбор calendar.json: только корректные ISO-даты и неотрицательные числа. */
export function parseCalendarPayload(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof raw !== "object" || raw === null) {
    return out;
  }
  for (const [k, v] of Object.entries(raw)) {
    if (!DATE_KEY.test(k)) {
      continue;
    }
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Сумма вкладов по календарю. */
export function sumCalendarPayload(raw: unknown): number {
  const map = parseCalendarPayload(raw);
  let sum = 0;
  for (const v of Object.values(map)) {
    sum += v;
  }
  return sum;
}

export type ProfileCalendarData = {
  byDate: Record<string, number>;
  total: number;
};

/**
 * Публичный calendar.json профиля отражает «Private contributions» на странице активности,
 * тогда как GET /users/:id/projects часто пустой без токена.
 */
export async function fetchProfileCalendar(
  username: string,
): Promise<ProfileCalendarData | null> {
  const trimmed = username.trim();
  if (!trimmed) {
    return null;
  }

  const url = `${gitlabWebOrigin()}/users/${encodeURIComponent(trimmed)}/calendar.json`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    return null;
  }

  let text: string;
  try {
    text = await res.text();
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(text) as unknown;
    const byDate = parseCalendarPayload(data);
    const total = Object.values(byDate).reduce((a, b) => a + b, 0);
    return total > 0 ? { byDate, total } : null;
  } catch {
    return null;
  }
}
