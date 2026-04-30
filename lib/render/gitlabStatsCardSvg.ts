import type { CardThemeColors } from "@/lib/render/theme";
import {
  HEATMAP_DISPLAY_WEEKS,
  buildContributionHeatmap,
  contributionLevel,
  maxHeatmapCount,
} from "@/lib/render/contributionHeatmap";
import type { ProfileCalendarData } from "@/lib/gitlab/profileCalendar";
import {
  cellFill,
  heatPalette,
  hexColor,
  luminance,
  mixHex,
} from "@/lib/render/heatmapPalette";
import {
  ACTIVITY_FOOTER_EN,
  cellHoverTitle,
  formatContributions,
  legendTierCaption,
  resolveStatsHeading,
} from "@/lib/render/statsLabels";
import { escapeSvgText } from "./svgEscape";

const CARD_W = 502;
const PAD = 22;
const RX = 12;
const FONT =
  "Segoe UI, Ubuntu, Helvetica, Arial, Noto Sans, system-ui, sans-serif";

function resolveBorder(theme: CardThemeColors): string {
  if (theme.border_color === undefined || theme.border_color === "") {
    return "#e4e2e2";
  }
  return hexColor(theme.border_color);
}

function safeSvgIdPart(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 48) || "card";
}

export function renderGitLabStatsCardSvg(opts: {
  username: string;
  name: string;
  projectCount: number;
  starsTotal: number;
  profileCalendar: ProfileCalendarData | null;
  theme: CardThemeColors;
  hideBorder: boolean;
  showIcons: boolean;
  customTitle?: string | null;
  /** Анимация ячеек и тень карточки (может ломать превью в GitHub README). По умолчанию выключено. */
  animateHeatmap?: boolean;
}): string {
  const {
    username,
    name,
    projectCount,
    starsTotal,
    profileCalendar,
    theme,
    hideBorder,
    showIcons,
    customTitle,
    animateHeatmap = false,
  } = opts;

  const bg = hexColor(theme.bg_color);
  const titleC = hexColor(theme.title_color);
  const textC = hexColor(theme.text_color);
  const mutedC = mixHex(hexColor(theme.text_color), bg, 0.35);
  const iconC = hexColor(theme.icon_color);
  const border = resolveBorder(theme);
  const pal = heatPalette(theme);

  const uid = safeSvgIdPart(username);

  const title = resolveStatsHeading(customTitle, name, username);
  const titleEsc = escapeSvgText(title);

  const titleSize = 18;
  const rowH = 24;
  let cursorY = PAD + titleSize;

  const statsRows: { label: string; value: string }[] = [];
  if (projectCount > 0) {
    statsRows.push({
      label: "Total Projects",
      value: String(projectCount),
    });
  }
  if (starsTotal > 0) {
    statsRows.push({
      label: "Total Stars",
      value: String(starsTotal),
    });
  }

  const showHeatmap =
    profileCalendar !== null &&
    Object.keys(profileCalendar.byDate).length > 0;

  const heatmapStyleBlock =
    showHeatmap && animateHeatmap
      ? `<style>
@keyframes hm-pop {
  from { opacity: 0; transform: scale(0.35); }
  to { opacity: 1; transform: scale(1); }
}
.hm-r {
  transform-box: fill-box;
  transform-origin: center;
  animation: hm-pop 0.45s cubic-bezier(0.34, 1.35, 0.64, 1) forwards;
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .hm-r { animation: none !important; opacity: 1 !important; }
}
</style>`
      : "";

  /** Отдельная строка «Contributions», только если нет теплокарты (есть только число). */
  const showContributionsRowOnly =
    !showHeatmap &&
    profileCalendar !== null &&
    profileCalendar.total > 0;

  if (showContributionsRowOnly) {
    statsRows.push({
      label: "Contributions",
      value: formatContributions(profileCalendar.total),
    });
  }

  let statsSvg = "";
  const bulletR = 4;
  const labelX = showIcons ? PAD + 14 : PAD;
  const valueX = CARD_W - PAD;

  if (statsRows.length > 0) {
    cursorY += 14;
    statsSvg = statsRows
      .map((row, i) => {
        const y = cursorY + i * rowH;
        const bullet =
          showIcons &&
          `  <circle cx="${PAD + bulletR}" cy="${y}" r="${bulletR}" fill="${iconC}"/>`;
        const labelEsc = escapeSvgText(row.label);
        const valueEsc = escapeSvgText(row.value);
        const parts = [
          bullet,
          `  <text x="${labelX}" y="${y}" font-family="${FONT}" font-size="13" fill="${textC}" dominant-baseline="middle">${labelEsc}</text>`,
          `  <text x="${valueX}" y="${y}" font-family="${FONT}" font-size="13" font-weight="600" fill="${textC}" dominant-baseline="middle" text-anchor="end">${valueEsc}</text>`,
        ].filter(Boolean);
        return parts.join("\n");
      })
      .join("\n");
    cursorY += statsRows.length * rowH;
  }

  let heatmapSvg = "";
  let heatSubtitleSvg = "";

  if (showHeatmap && profileCalendar) {
    cursorY += statsRows.length > 0 ? 14 : 10;
    const sub =
      `${formatContributions(profileCalendar.total)} contributions · last ${HEATMAP_DISPLAY_WEEKS} weeks`;
    heatSubtitleSvg = `  <text x="${PAD}" y="${cursorY}" font-family="${FONT}" font-size="12" fill="${mutedC}">${escapeSvgText(sub)}</text>`;
    cursorY += 20;

    const labelColW = 20;
    const cell = 11;
    const gap = 3;
    const hmX = PAD + labelColW;
    const hmTop = cursorY;

    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const weekLabels = weekdays
      .map((mark, row) => {
        const y = hmTop + row * (cell + gap) + cell / 2 + 1;
        return `  <text x="${PAD + 18}" y="${y}" font-family="${FONT}" font-size="9" fill="${mutedC}" text-anchor="end" dominant-baseline="middle">${mark}</text>`;
      })
      .join("\n");

    const columns = buildContributionHeatmap(
      profileCalendar.byDate,
      HEATMAP_DISPLAY_WEEKS,
    );
    const maxC = maxHeatmapCount(columns);

    const rects: string[] = [];
    let animIndex = 0;
    for (let col = 0; col < columns.length; col++) {
      const weekCol = columns[col]!;
      for (let row = 0; row < weekCol.length; row++) {
        const day = weekCol[row]!;
        const lvl = contributionLevel(day.count, maxC);
        const fill = cellFill(lvl, day.isFuture, pal);
        const x = hmX + col * (cell + gap);
        const y = hmTop + row * (cell + gap);
        const tip = escapeSvgText(cellHoverTitle(day.dateKey, day.count, day.isFuture));
        const delay = animateHeatmap ? animIndex * 4 : 0;
        animIndex += 1;
        const rectSvg = animateHeatmap
          ? `    <rect class="hm-r" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" ry="2" fill="${fill}" style="animation-delay:${delay}ms"/>`
          : `    <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" ry="2" fill="${fill}"/>`;
        rects.push(`  <g>\n    <title>${tip}</title>\n${rectSvg}\n  </g>`);
      }
    }

    cursorY = hmTop + 7 * (cell + gap) - gap + 10;

    const legY = cursorY + 6;
    const legStartX = hmX;
    const legendLevels = [0, 1, 2, 3, 4] as const;
    const lx = legStartX + 54;
    heatmapSvg = [
      heatSubtitleSvg,
      weekLabels,
      rects.join("\n"),
      `  <text x="${legStartX}" y="${legY}" font-family="${FONT}" font-size="10" fill="${mutedC}" dominant-baseline="middle">Less</text>`,
      ...legendLevels.map((lv, i) => {
        const fill =
          lv === 0 ? pal.empty : cellFill(lv as 1 | 2 | 3 | 4, false, pal);
        const rx = lx + i * (cell + gap);
        const ry = legY - cell / 2;
        const legTip = escapeSvgText(
          legendTierCaption(lv, maxC),
        );
        return (
          `  <g>` +
          `\n    <title>${legTip}</title>` +
          `\n    <rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" rx="2" ry="2" fill="${fill}"/>` +
          `\n  </g>`
        );
      }),
      `  <text x="${lx + legendLevels.length * (cell + gap) + 8}" y="${legY}" font-family="${FONT}" font-size="10" fill="${mutedC}" dominant-baseline="middle">More</text>`,
      `  <text x="${CARD_W - PAD}" y="${legY + cell / 2 + 14}" font-family="${FONT}" font-size="9.5" fill="${mutedC}" text-anchor="end" dominant-baseline="middle">${escapeSvgText(ACTIVITY_FOOTER_EN)}</text>`,
    ].join("\n");

    cursorY = legY + cell / 2 + 16 + 18;
  } else {
    heatSubtitleSvg = "";
    cursorY += statsRows.length > 0 ? 0 : 4;
  }

  const height = Math.max(cursorY + PAD, PAD * 2 + titleSize + 8);

  const strokeAttr = hideBorder ? "" : ` stroke="${border}" stroke-width="1"`;

  const filterDef = animateHeatmap
    ? `
    <filter id="soft_${uid}" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="${luminance(bg) < 0.42 ? 0.35 : 0.08}"/>
    </filter>`
    : "";

  const defs = `
  <defs>
    <linearGradient id="bg_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${mixHex(bg, iconC, luminance(bg) < 0.42 ? 0.06 : 0.04)}" stop-opacity="1"/>
    </linearGradient>${filterDef}
  </defs>`;

  const bgFilterAttr = animateHeatmap ? ` filter="url(#soft_${uid})"` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${height}" viewBox="0 0 ${CARD_W} ${height}">
${defs}
${heatmapStyleBlock}
  <rect width="100%" height="100%" rx="${RX}" ry="${RX}" fill="url(#bg_${uid})"${strokeAttr}${bgFilterAttr}/>
  <text x="${PAD}" y="${PAD + titleSize - 2}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="${titleC}" letter-spacing="-0.02em">${titleEsc}</text>
${statsSvg}
${showHeatmap ? heatmapSvg : heatSubtitleSvg}
</svg>`;
}
