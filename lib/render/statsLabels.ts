export function resolveStatsHeading(
  customTitle: string | null | undefined,
  name: string,
  username: string,
): string {
  const custom = customTitle?.trim();
  if (custom) {
    return custom;
  }
  const n = name.trim();
  if (n) {
    return `${n}'s GitLab`;
  }
  return username.trim() || "GitLab";
}

export function formatContributions(n: number): string {
  return n.toLocaleString("en-US");
}

export const ACTIVITY_FOOTER_EN =
  "Issues, merge requests, pushes, and comments.";

export function contribUnit(n: number): string {
  return n === 1 ? "contribution" : "contributions";
}

/** Длинная дата (UTC по ключу YYYY-MM-DD). */
export function formatHeatmapDayLongUtc(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Две строки для SVG &lt;title&gt; и для попапа. */
export function cellHoverTitle(
  dateKey: string,
  count: number,
  isFuture: boolean,
): string {
  const dayLine = formatHeatmapDayLongUtc(dateKey);
  if (isFuture) {
    return `No contributions${"\n"}${dayLine}`;
  }
  if (count <= 0) {
    return `No contributions${"\n"}${dayLine}`;
  }
  return `${formatContributions(count)} ${contribUnit(count)}${"\n"}${dayLine}`;
}

export function dayPopupContent(
  dateKey: string,
  count: number,
  isFuture: boolean,
): { headline: string; dateLine: string } {
  const dateLine = formatHeatmapDayLongUtc(dateKey);
  if (isFuture || count <= 0) {
    return { headline: "No contributions", dateLine };
  }
  return {
    headline: `${formatContributions(count)} ${contribUnit(count)}`,
    dateLine,
  };
}

/** Подписи уровней шкалы (как contributionLevel / maxCount). */
export function legendTierCaption(level: 0 | 1 | 2 | 3 | 4, maxC: number): string {
  if (level === 0) {
    return "No contributions";
  }
  const m = Math.max(1, Math.round(maxC));
  const cap = (t: number) => Math.min(m, Math.max(1, Math.ceil(t * m)));
  const u1 = cap(0.2);
  const u2 = cap(0.4);
  const u3 = cap(0.6);
  switch (level) {
    case 1:
      return u1 <= 1
        ? `1 ${contribUnit(1)} per day`
        : `1–${u1} contributions per day`;
    case 2: {
      const lo = Math.min(u1 + 1, m);
      const hi = Math.max(lo, u2);
      return lo >= hi
        ? `${lo} contributions per day`
        : `${lo}–${hi} contributions per day`;
    }
    case 3: {
      const lo = Math.min(u2 + 1, m);
      const hi = Math.max(lo, u3);
      return lo >= hi
        ? `${lo} contributions per day`
        : `${lo}–${hi} contributions per day`;
    }
    case 4: {
      const lo = Math.min(u3 + 1, m);
      return `${lo}+ contributions per day`;
    }
    default:
      return "";
  }
}
