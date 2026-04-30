import type { CardThemeColors } from "@/lib/render/theme";

export function hexColor(c: string): string {
  return c.startsWith("#") ? c : `#${c}`;
}

function normalizeHex(raw: string): string {
  const c = raw.startsWith("#") ? raw.slice(1) : raw;
  if (c.length === 3) {
    return c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  return c;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return rgbToHex(r, g, bl);
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function heatPalette(theme: CardThemeColors): {
  empty: string;
  u1: string;
  u2: string;
  u3: string;
  u4: string;
  future: string;
} {
  const bg = hexColor(theme.bg_color);
  const accent = hexColor(theme.icon_color);
  const dark = luminance(bg) < 0.42;
  const empty = dark
    ? mixHex(bg, "#94a3b8", 0.28)
    : mixHex(bg, "#d0d7de", 0.52);
  const future = dark
    ? mixHex(bg, "#64748b", 0.14)
    : mixHex(bg, "#eaeef2", 0.92);
  return {
    empty,
    u1: mixHex(empty, accent, dark ? 0.38 : 0.48),
    u2: mixHex(empty, accent, dark ? 0.58 : 0.66),
    u3: mixHex(empty, accent, dark ? 0.76 : 0.82),
    u4: mixHex(empty, accent, dark ? 0.92 : 0.94),
    future,
  };
}

export function cellFill(
  level: number,
  isFuture: boolean,
  pal: ReturnType<typeof heatPalette>,
): string {
  if (isFuture) {
    return pal.future;
  }
  switch (level) {
    case 1:
      return pal.u1;
    case 2:
      return pal.u2;
    case 3:
      return pal.u3;
    case 4:
      return pal.u4;
    default:
      return pal.empty;
  }
}
