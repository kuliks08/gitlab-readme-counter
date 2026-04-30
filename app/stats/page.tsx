import { parseBool, pickTheme, pickUsername } from "@/lib/query/commonOptions";
import { parseCustomTitle } from "@/lib/query/customTitle";
import { resolveTheme } from "@/lib/render/theme";
import { loadGitLabStats } from "@/lib/stats/loadGitLabStats";
import { InteractiveStatsCard } from "./interactive-stats-card";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function recordToSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.length > 0) {
      qs.set(k, v);
    }
  }
  return qs;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const qs = recordToSearchParams(raw);
  const username = pickUsername(qs);

  if (!username) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          maxWidth: 560,
          margin: "0 auto",
          lineHeight: 1.5,
        }}
      >
        <p>
          Укажите ник в адресе:{" "}
          <code style={{ fontSize: "0.95em" }}>?username=ВАШ_NICK</code> или{" "}
          <code style={{ fontSize: "0.95em" }}>user=</code>.
        </p>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Здесь интерактивная карточка: клик по дню или по квадрату шкалы. Для
          статичной картинки в README используйте эндпоинт{" "}
          <code style={{ fontSize: "0.95em" }}>/api?username=…</code>.
        </p>
      </main>
    );
  }

  const loaded = await loadGitLabStats(username);
  if (!loaded.ok) {
    const msg =
      loaded.error === "not_found"
        ? "Пользователь GitLab не найден."
        : "Ошибка GitLab API.";
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <p>{msg}</p>
      </main>
    );
  }

  const theme = resolveTheme(pickTheme(qs));
  const hideBorder = parseBool(qs, "hide_border", false);
  const customTitle = parseCustomTitle(qs);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 16px 48px",
        boxSizing: "border-box",
      }}
    >
      <InteractiveStatsCard
        username={loaded.user.username}
        name={loaded.user.name}
        projectCount={loaded.projectCount}
        starsTotal={loaded.starsTotal}
        profileCalendar={loaded.profileCalendar}
        theme={theme}
        hideBorder={hideBorder}
        customTitle={customTitle}
      />
    </main>
  );
}
