"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProfileCalendarData } from "@/lib/gitlab/profileCalendar";
import type { HeatmapDayCell } from "@/lib/render/contributionHeatmap";
import {
  HEATMAP_DISPLAY_WEEKS,
  buildContributionHeatmap,
  contributionLevel,
  maxHeatmapCount,
} from "@/lib/render/contributionHeatmap";
import {
  cellFill,
  heatPalette,
  hexColor,
  luminance,
  mixHex,
} from "@/lib/render/heatmapPalette";
import type { CardThemeColors } from "@/lib/render/theme";
import {
  ACTIVITY_FOOTER_EN,
  dayPopupContent,
  formatContributions,
  legendTierCaption,
  resolveStatsHeading,
} from "@/lib/render/statsLabels";

const CARD_MAX_W = 502;
const PAD = 22;
const CELL = 11;
const GAP = 3;

export type InteractiveStatsCardProps = {
  username: string;
  name: string;
  projectCount: number;
  starsTotal: number;
  profileCalendar: ProfileCalendarData | null;
  theme: CardThemeColors;
  hideBorder: boolean;
  customTitle: string | null;
};

type PopupState =
  | {
      kind: "day";
      clientX: number;
      clientY: number;
      dateKey: string;
      count: number;
      isFuture: boolean;
    }
  | {
      kind: "legend";
      clientX: number;
      clientY: number;
      caption: string;
    };

export function InteractiveStatsCard(props: InteractiveStatsCardProps) {
  const {
    username,
    name,
    projectCount,
    starsTotal,
    profileCalendar,
    theme,
    hideBorder,
    customTitle,
  } = props;

  const [popup, setPopup] = useState<PopupState | null>(null);
  const [vw, setVw] = useState(1200);
  const popupPanelRef = useRef<HTMLDivElement | null>(null);

  const bg = hexColor(theme.bg_color);
  const titleC = hexColor(theme.title_color);
  const textC = hexColor(theme.text_color);
  const muted = mixHex(textC, bg, 0.35);
  const iconC = hexColor(theme.icon_color);
  const border =
    theme.border_color === undefined || theme.border_color === ""
      ? "#e4e2e2"
      : hexColor(theme.border_color);
  const darkBg = luminance(bg) < 0.42;

  const heading = resolveStatsHeading(customTitle, name, username);
  const pal = heatPalette(theme);

  const showHeatmap =
    profileCalendar !== null &&
    Object.keys(profileCalendar.byDate).length > 0;

  const showContributionsRowOnly =
    !showHeatmap &&
    profileCalendar !== null &&
    profileCalendar.total > 0;

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!popup) return;
    let detach: (() => void) | undefined;
    let innerRaf: number | undefined;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        const onPointerDown = (e: PointerEvent) => {
          const panel = popupPanelRef.current;
          const n = e.target;
          if (!(n instanceof Node)) return;
          if (panel?.contains(n)) return;
          setPopup(null);
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        detach = () =>
          document.removeEventListener("pointerdown", onPointerDown, true);
      });
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf !== undefined) cancelAnimationFrame(innerRaf);
      detach?.();
    };
  }, [popup]);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopup(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup]);

  const openDay = useCallback((e: React.MouseEvent, day: HeatmapDayCell) => {
    e.preventDefault();
    e.stopPropagation();
    setPopup({
      kind: "day",
      clientX: e.clientX,
      clientY: e.clientY,
      dateKey: day.dateKey,
      count: day.count,
      isFuture: day.isFuture,
    });
  }, []);

  const openLegend = useCallback((e: React.MouseEvent, caption: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPopup({
      kind: "legend",
      clientX: e.clientX,
      clientY: e.clientY,
      caption,
    });
  }, []);

  const columns =
    showHeatmap && profileCalendar
      ? buildContributionHeatmap(
          profileCalendar.byDate,
          HEATMAP_DISPLAY_WEEKS,
        )
      : [];
  const maxC = columns.length ? maxHeatmapCount(columns) : 0;

  const cardBg = `linear-gradient(145deg, ${bg} 0%, ${mixHex(bg, iconC, darkBg ? 0.07 : 0.045)} 100%)`;

  const popupGlass = darkBg
    ? "rgba(22, 24, 34, 0.92)"
    : "rgba(255, 255, 255, 0.94)";
  const popupBorder = darkBg
    ? "rgba(255,255,255,0.12)"
    : "rgba(15, 23, 42, 0.08)";
  const popupShadow = darkBg
    ? "0 18px 44px rgba(0,0,0,0.45)"
    : "0 18px 44px rgba(15, 23, 42, 0.14)";

  const leftClamp = (x: number) =>
    Math.min(Math.max(x, 72), Math.max(72, vw - 72));

  const renderPopup = () => {
    if (!popup) return null;
    const flipBelow = popup.clientY < 130;
    const left = leftClamp(popup.clientX);
    const top = popup.clientY;
    const transform = flipBelow
      ? "translate(-50%, 10px)"
      : "translate(-50%, calc(-100% - 10px))";

    let headline = "";
    let sub = "";
    let footer: string | null = ACTIVITY_FOOTER_EN;

    if (popup.kind === "day") {
      const d = dayPopupContent(popup.dateKey, popup.count, popup.isFuture);
      headline = d.headline;
      sub = d.dateLine;
    } else {
      headline = popup.caption;
      sub = "";
      footer = null;
    }

    const panel = (
      <div
        ref={popupPanelRef}
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          zIndex: 50_000,
          left,
          top,
          transform,
          minWidth: 168,
          maxWidth: 280,
          padding: "14px 16px",
          borderRadius: 14,
          backgroundColor: popupGlass,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: `1px solid ${popupBorder}`,
          boxShadow: popupShadow,
          color: darkBg ? "#e8ecf7" : "#1e293b",
          pointerEvents: "auto",
          animation: "stats-pop-in 0.22s ease-out",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
          }}
        >
          {headline}
        </div>
        {sub ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              opacity: 0.88,
              lineHeight: 1.35,
            }}
          >
            {sub}
          </div>
        ) : null}
        {footer ? (
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              opacity: 0.62,
              lineHeight: 1.35,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    );

    return createPortal(panel, document.body);
  };

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <>
      <style>{`
        @keyframes stats-pop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .stats-hm-btn {
          display: block;
          padding: 0;
          margin: 0;
          border: none;
          cursor: pointer;
          border-radius: 3px;
          transition: transform 0.14s ease, box-shadow 0.14s ease;
        }
        .stats-hm-btn:focus-visible {
          outline: 2px solid ${iconC};
          outline-offset: 2px;
        }
        .stats-hm-btn:hover {
          transform: scale(1.14);
          z-index: 3;
          box-shadow: 0 0 0 1px ${darkBg ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.12)"};
        }
        .stats-leg-btn:hover {
          transform: scale(1.12);
        }
      `}</style>
      <div
        style={{
          maxWidth: CARD_MAX_W,
          margin: "0 auto",
          padding: PAD,
          borderRadius: 14,
          background: cardBg,
          border: hideBorder ? "none" : `1px solid ${border}`,
          boxShadow: darkBg
            ? "0 16px 40px rgba(0,0,0,0.35)"
            : "0 16px 40px rgba(15, 23, 42, 0.09)",
          fontFamily:
            'Segoe UI, system-ui, Ubuntu, Helvetica, Arial, "Noto Sans", sans-serif',
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: titleC,
            letterSpacing: "-0.02em",
          }}
        >
          {heading}
        </h1>

        {(projectCount > 0 || starsTotal > 0 || showContributionsRowOnly) && (
          <dl
            style={{
              margin: "14px 0 0",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              rowGap: 10,
              columnGap: 16,
              fontSize: 13,
              color: textC,
            }}
          >
            {projectCount > 0 ? (
              <>
                <dt style={{ margin: 0 }}>Total Projects</dt>
                <dd style={{ margin: 0, fontWeight: 650 }}>{projectCount}</dd>
              </>
            ) : null}
            {starsTotal > 0 ? (
              <>
                <dt style={{ margin: 0 }}>Total Stars</dt>
                <dd style={{ margin: 0, fontWeight: 650 }}>{starsTotal}</dd>
              </>
            ) : null}
            {showContributionsRowOnly ? (
              <>
                <dt style={{ margin: 0 }}>Contributions</dt>
                <dd style={{ margin: 0, fontWeight: 650 }}>
                  {formatContributions(profileCalendar!.total)}
                </dd>
              </>
            ) : null}
          </dl>
        )}

        {showHeatmap && profileCalendar ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: muted }}>
              {formatContributions(profileCalendar.total)} contributions · last{" "}
              {HEATMAP_DISPLAY_WEEKS} weeks
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: GAP,
                  paddingTop: 1,
                  width: 22,
                  flexShrink: 0,
                }}
              >
                {weekdays.map((w) => (
                  <div
                    key={w}
                    style={{
                      height: CELL,
                      fontSize: 9,
                      color: muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 2,
                    }}
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: GAP,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((row) => (
                  <div
                    key={row}
                    style={{ display: "flex", gap: GAP, alignItems: "center" }}
                  >
                    {columns.map((col, ci) => {
                      const day = col[row]!;
                      const lvl = contributionLevel(day.count, maxC);
                      const fill = cellFill(lvl, day.isFuture, pal);
                      return (
                        <button
                          key={`${ci}-${row}-${day.dateKey}`}
                          type="button"
                          className="stats-hm-btn"
                          aria-label={`${day.dateKey}: ${day.count} contributions`}
                          style={{
                            width: CELL,
                            height: CELL,
                            backgroundColor: fill,
                            flexShrink: 0,
                          }}
                          onClick={(ev) => openDay(ev, day)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 10, color: muted }}>Less</span>
              {([0, 1, 2, 3, 4] as const).map((lv) => {
                const fill =
                  lv === 0 ? pal.empty : cellFill(lv, false, pal);
                const cap = legendTierCaption(lv, maxC);
                return (
                  <button
                    key={lv}
                    type="button"
                    title={cap}
                    className="stats-hm-btn stats-leg-btn"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: fill,
                      flexShrink: 0,
                    }}
                    onClick={(ev) => openLegend(ev, cap)}
                  />
                );
              })}
              <span style={{ fontSize: 10, color: muted }}>More</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 9.5,
                  color: muted,
                  textAlign: "right",
                  maxWidth: 240,
                  lineHeight: 1.35,
                }}
              >
                {ACTIVITY_FOOTER_EN}
              </span>
            </div>
          </div>
        ) : null}

        <p style={{ margin: "18px 0 0", fontSize: 11, color: muted }}>
          @{username} ·{" "}
          <a
            href={`/api?username=${encodeURIComponent(username)}`}
            style={{ color: iconC }}
          >
            SVG for README
          </a>
        </p>
      </div>
      {renderPopup()}
    </>
  );
}
