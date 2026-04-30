/**
 * Палитры `default` и `tokyonight` совпадают с github-readme-stats (themes/index.js).
 * См. LICENSE-THIRD-PARTY.md (MIT).
 */

export type CardThemeColors = {
  title_color: string;
  icon_color: string;
  text_color: string;
  bg_color: string;
  /** В апстриме не у всех тем задано (напр. `tokyonight`). */
  border_color?: string;
};

const DEFAULT_THEME: CardThemeColors = {
  title_color: "2f80ed",
  icon_color: "4c71f2",
  text_color: "434d58",
  bg_color: "fffefe",
  border_color: "e4e2e2",
};

const TOKYO_NIGHT: CardThemeColors = {
  title_color: "70a5fd",
  icon_color: "bf91f3",
  text_color: "38bdae",
  bg_color: "1a1b27",
};

const THEMES: Record<string, CardThemeColors> = {
  default: DEFAULT_THEME,
  tokyonight: TOKYO_NIGHT,
};

export function resolveTheme(name: string): CardThemeColors {
  const key = name.trim().toLowerCase();
  return THEMES[key] ?? DEFAULT_THEME;
}
