import { CACHE_ERR, CACHE_OK, svgResponse } from "@/lib/http/svgResponse";
import { parseBool, pickTheme, pickUsername } from "@/lib/query/commonOptions";
import { parseCustomTitle } from "@/lib/query/customTitle";
import { renderErrorCardSvg } from "@/lib/render/errorCardSvg";
import { renderGitLabStatsCardSvg } from "@/lib/render/gitlabStatsCardSvg";
import { resolveTheme } from "@/lib/render/theme";
import { loadGitLabStatsCached } from "@/lib/cache/cachedGitLabStats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const username = pickUsername(sp);
  if (!username) {
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Stats",
        message:
          "Missing username. Add ?username=YOUR_GITLAB_USERNAME (or user=) to the URL.",
        theme: resolveTheme("default"),
        hideBorder: false,
      }),
      CACHE_ERR,
    );
  }

  const theme = resolveTheme(pickTheme(sp));
  const hideBorder = parseBool(sp, "hide_border", false);
  const showIcons = parseBool(sp, "show_icons", false);
  const customTitle = parseCustomTitle(sp);

  const loaded = await loadGitLabStatsCached(username);
  if (!loaded.ok) {
    const message =
      loaded.error === "not_found" ? "User not found" : "GitLab API error";
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Stats",
        message,
        theme,
        hideBorder,
      }),
      CACHE_ERR,
    );
  }

  return svgResponse(
    renderGitLabStatsCardSvg({
      username: loaded.user.username,
      name: loaded.user.name,
      projectCount: loaded.projectCount,
      starsTotal: loaded.starsTotal,
      profileCalendar: loaded.profileCalendar,
      theme,
      hideBorder,
      showIcons,
      customTitle,
    }),
    CACHE_OK,
  );
}
