import type { CardThemeColors } from "@/lib/render/theme";
import { escapeSvgText } from "./svgEscape";

const CARD_W = 495;
const PAD = 25;
const RX = 8;
const FONT =
  "Segoe UI, Ubuntu, Helvetica, Arial, Noto Sans, sans-serif";

/** Частые языки — в духе github-readme-stats; остальное — стабильный цвет из хэша имени */
const KNOWN_LANG_HEX: Record<string, string> = {
  javascript: "f1e05a",
  typescript: "3178c6",
  python: "3572a5",
  java: "b07219",
  go: "00add8",
  rust: "dea584",
  ruby: "701516",
  php: "4f5d95",
  c: "555555",
  cpp: "f34b7d",
  csharp: "178600",
  swift: "fa7343",
  kotlin: "a97bff",
  dart: "00b4ab",
  shell: "89e051",
  html: "e34c26",
  css: "563d7c",
  vue: "41b883",
  scala: "c22d40",
};

function hexColor(c: string): string {
  return c.startsWith("#") ? c : `#${c}`;
}

function resolveBorder(theme: CardThemeColors): string {
  if (theme.border_color === undefined || theme.border_color === "") {
    return "#e4e2e2";
  }
  return hexColor(theme.border_color);
}

function langBarColor(lang: string): string {
  const key = lang.trim().toLowerCase();
  const hex = KNOWN_LANG_HEX[key];
  if (hex) return `#${hex}`;
  let h = 0;
  for (let i = 0; i < lang.length; i++) {
    h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue}, 62%, 52%)`;
}

function renderCompact(
  title: string,
  entries: { lang: string; percent: number }[],
  theme: CardThemeColors,
  hideBorder: boolean,
): string {
  const bg = hexColor(theme.bg_color);
  const titleC = hexColor(theme.title_color);
  const textC = hexColor(theme.text_color);
  const border = resolveBorder(theme);

  const titleSize = 16;
  const rowH = 22;
  const barSlotW = 220;
  const barH = 8;
  const titleBlockH = PAD + titleSize + 14;
  const rowStartY = titleBlockH;

  let bodyH: number;
  let rowsSvg: string;

  if (!entries.length) {
    rowsSvg = `  <text x="${CARD_W / 2}" y="${rowStartY + 12}" font-family="${FONT}" font-size="13" fill="${textC}" text-anchor="middle">${escapeSvgText(
      "No language data",
    )}</text>`;
    bodyH = 36;
  } else {
    rowsSvg = entries
      .map((e, i) => {
        const y = rowStartY + i * rowH;
        const pct = Math.max(0, Math.min(100, e.percent));
        const bw = (pct / 100) * barSlotW;
        const langEsc = escapeSvgText(e.lang);
        const pctStr = `${pct.toFixed(1)}%`;
        const labelX = PAD;
        const barX = 150;
        const pctX = barX + barSlotW + 12;
        return `  <text x="${labelX}" y="${y}" font-family="${FONT}" font-size="13" fill="${textC}" dominant-baseline="middle">${langEsc}</text>
  <rect x="${barX}" y="${y - barH / 2}" width="${barSlotW}" height="${barH}" rx="4" ry="4" fill="${textC}" opacity="0.14"/>
  <rect x="${barX}" y="${y - barH / 2}" width="${bw}" height="${barH}" rx="4" ry="4" fill="${langBarColor(e.lang)}"/>
  <text x="${pctX}" y="${y}" font-family="${FONT}" font-size="13" fill="${textC}" dominant-baseline="middle">${escapeSvgText(
          pctStr,
        )}</text>`;
      })
      .join("\n");
    bodyH = entries.length * rowH + 8;
  }

  const height = titleBlockH + bodyH + PAD;
  const strokeAttr = hideBorder ? "" : ` stroke="${border}" stroke-width="1"`;
  const titleEsc = escapeSvgText(title);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${height}" viewBox="0 0 ${CARD_W} ${height}">
  <rect width="100%" height="100%" rx="${RX}" ry="${RX}" fill="${bg}"${strokeAttr}/>
  <text x="${PAD}" y="${PAD + titleSize}" font-family="${FONT}" font-size="${titleSize}" font-weight="600" fill="${titleC}">${titleEsc}</text>
${rowsSvg}
</svg>`;
}

function renderNormal(
  title: string,
  entries: { lang: string; percent: number }[],
  theme: CardThemeColors,
  hideBorder: boolean,
): string {
  const bg = hexColor(theme.bg_color);
  const titleC = hexColor(theme.title_color);
  const textC = hexColor(theme.text_color);
  const border = resolveBorder(theme);

  const titleSize = 16;
  const titleBlockH = PAD + titleSize + 16;
  const maxBarH = 112;
  const labelH = 36;
  const chartTop = titleBlockH;
  const baselineY = chartTop + maxBarH;

  let chartSvg: string;

  if (!entries.length) {
    chartSvg = `  <text x="${CARD_W / 2}" y="${baselineY - 40}" font-family="${FONT}" font-size="13" fill="${textC}" text-anchor="middle">${escapeSvgText(
      "No language data",
    )}</text>`;
  } else {
    const n = entries.length;
    const gap = 10;
    const inner = CARD_W - 2 * PAD;
    const barW = Math.max(28, Math.floor((inner - gap * (n - 1)) / n));
    const chartW = n * barW + (n - 1) * gap;
    const startX = PAD + Math.max(0, (inner - chartW) / 2);

    chartSvg = entries
      .map((e, i) => {
        const pct = Math.max(0, Math.min(100, e.percent));
        const h = (pct / 100) * maxBarH;
        const x = startX + i * (barW + gap);
        const y = baselineY - h;
        const langEsc = escapeSvgText(e.lang);
        const pctStr = `${pct.toFixed(0)}%`;
        return `  <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" ry="4" fill="${langBarColor(e.lang)}"/>
  <text x="${x + barW / 2}" y="${baselineY + 14}" font-family="${FONT}" font-size="11" fill="${textC}" text-anchor="middle">${langEsc}</text>
  <text x="${x + barW / 2}" y="${baselineY + 28}" font-family="${FONT}" font-size="10" fill="${textC}" opacity="0.85" text-anchor="middle">${escapeSvgText(
          pctStr,
        )}</text>`;
      })
      .join("\n");
  }

  const height = baselineY + labelH + PAD;
  const strokeAttr = hideBorder ? "" : ` stroke="${border}" stroke-width="1"`;
  const titleEsc = escapeSvgText(title);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${height}" viewBox="0 0 ${CARD_W} ${height}">
  <rect width="100%" height="100%" rx="${RX}" ry="${RX}" fill="${bg}"${strokeAttr}/>
  <text x="${PAD}" y="${PAD + titleSize}" font-family="${FONT}" font-size="${titleSize}" font-weight="600" fill="${titleC}">${titleEsc}</text>
${chartSvg}
</svg>`;
}

export function renderTopLangsSvg(opts: {
  title: string;
  entries: { lang: string; percent: number }[];
  layout: "normal" | "compact";
  theme: CardThemeColors;
  hideBorder: boolean;
}): string {
  const { title, entries, layout, theme, hideBorder } = opts;
  if (layout === "compact") {
    return renderCompact(title, entries, theme, hideBorder);
  }
  return renderNormal(title, entries, theme, hideBorder);
}
