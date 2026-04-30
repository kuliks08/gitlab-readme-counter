/** Колонки недели: индекс дня 0 = воскресенье … 6 = суббота (как сетка GitLab). */
export type HeatmapDayCell = {
  dateKey: string;
  count: number;
  isFuture: boolean;
};

export type HeatmapWeekColumn = HeatmapDayCell[];

/** Сколько последних недель показываем в карточке (компактно под README). */
export const HEATMAP_DISPLAY_WEEKS = 26;

export function buildContributionHeatmap(
  byDate: Record<string, number>,
  weeks: number,
): HeatmapWeekColumn[] {
  const today = new Date();
  const endUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  const start = new Date(endUtc);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));
  const dow = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - dow);

  const columns: HeatmapWeekColumn[] = [];
  const cursor = new Date(start);

  for (let w = 0; w < weeks; w++) {
    const col: HeatmapDayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const t = cursor.getTime();
      const isFuture = t > endUtc;
      const count = isFuture ? 0 : byDate[dateKey] ?? 0;
      col.push({ dateKey, count, isFuture });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    columns.push(col);
  }

  return columns;
}

export function maxHeatmapCount(columns: HeatmapWeekColumn[]): number {
  let m = 0;
  for (const col of columns) {
    for (const c of col) {
      if (!c.isFuture && c.count > m) {
        m = c.count;
      }
    }
  }
  return m;
}

/** Уровень интенсивности 0…4 (классическая шкала contribution grid). */
export function contributionLevel(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }
  const t = count / maxCount;
  if (t <= 0.2) {
    return 1;
  }
  if (t <= 0.4) {
    return 2;
  }
  if (t <= 0.6) {
    return 3;
  }
  return 4;
}
