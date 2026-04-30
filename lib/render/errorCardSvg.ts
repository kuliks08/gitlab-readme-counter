import type { CardThemeColors } from "@/lib/render/theme";
import { escapeSvgText } from "./svgEscape";

const CARD_W = 495;
const PAD = 25;
const RX = 8;

function hexColor(c: string): string {
  return c.startsWith("#") ? c : `#${c}`;
}

function resolveBorder(theme: CardThemeColors): string {
  if (theme.border_color === undefined || theme.border_color === "") {
    return "#e4e2e2";
  }
  return hexColor(theme.border_color);
}

function wrapMessage(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const paragraphs = normalized.split(/\n/);
  const lines: string[] = [];
  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length <= maxChars) {
        line = next;
      } else {
        if (line) lines.push(line);
        if (w.length <= maxChars) {
          line = w;
        } else {
          for (let i = 0; i < w.length; i += maxChars) {
            lines.push(w.slice(i, i + maxChars));
          }
          line = "";
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

export function renderErrorCardSvg(opts: {
  title: string;
  message: string;
  theme: CardThemeColors;
  hideBorder: boolean;
}): string {
  const { title, message, theme, hideBorder } = opts;
  const bg = hexColor(theme.bg_color);
  const titleC = hexColor(theme.title_color);
  const textC = hexColor(theme.text_color);
  const border = resolveBorder(theme);

  const titleEsc = escapeSvgText(title);
  const msgLines = wrapMessage(message, 58);
  const titleSize = 18;
  const msgSize = 14;
  const lineHeight = 16;
  const headerY = PAD + titleSize;
  const msgStartY = headerY + 28;
  const contentBottom = msgStartY + msgLines.length * lineHeight + 10;
  const height = Math.max(120, contentBottom + PAD);

  const strokeAttr = hideBorder ? "" : ` stroke="${border}" stroke-width="1"`;

  const font =
    "Segoe UI, Ubuntu, Helvetica, Arial, Noto Sans, sans-serif";

  const msgBlocks = msgLines
    .map(
      (ln, i) =>
        `  <text x="${PAD}" y="${msgStartY + i * lineHeight}" font-family="${font}" font-size="${msgSize}" fill="${textC}">${escapeSvgText(ln)}</text>`,
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${height}" viewBox="0 0 ${CARD_W} ${height}">
  <rect width="100%" height="100%" rx="${RX}" ry="${RX}" fill="${bg}"${strokeAttr}/>
  <text x="${PAD}" y="${headerY}" font-family="${font}" font-size="${titleSize}" font-weight="600" fill="${titleC}">${titleEsc}</text>
${msgBlocks}
</svg>`;
}
