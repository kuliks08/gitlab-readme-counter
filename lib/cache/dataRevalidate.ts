/** Лимит TTL для кэша данных GitLab (секунды). ENV: STATS_DATA_REVALIDATE_SECONDS. */
export function statsDataRevalidateSeconds(): number {
  const raw = process.env.STATS_DATA_REVALIDATE_SECONDS;
  if (raw === undefined || raw.trim() === "") {
    return 600;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) {
    return 600;
  }
  return Math.min(Math.max(n, 60), 86_400);
}
