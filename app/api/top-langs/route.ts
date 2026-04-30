import { takeTop } from "@/lib/aggregate/topLanguages";
import { loadTopLangsNormalizedCached } from "@/lib/cache/cachedTopLangs";
import { CACHE_ERR, CACHE_OK, svgResponse } from "@/lib/http/svgResponse";
import { parseBool, pickTheme, pickUsername } from "@/lib/query/commonOptions";
import { parseLangsCount, parseTopLangLayout } from "@/lib/query/topLangsOptions";
import { renderErrorCardSvg } from "@/lib/render/errorCardSvg";
import { resolveTheme } from "@/lib/render/theme";
import { renderTopLangsSvg } from "@/lib/render/topLangsCardSvg";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const username = pickUsername(sp);
  if (!username) {
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Top Languages",
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

  const data = await loadTopLangsNormalizedCached(username);
  if (!data.ok) {
    const message =
      data.error === "not_found" ? "User not found" : "GitLab API error";
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Top Languages",
        message,
        theme,
        hideBorder,
      }),
      CACHE_ERR,
    );
  }

  const top = takeTop(data.normalized, parseLangsCount(sp));
  const layout = parseTopLangLayout(sp);

  return svgResponse(
    renderTopLangsSvg({
      title: "Most Used Languages",
      entries: top,
      layout,
      theme,
      hideBorder,
    }),
    CACHE_OK,
  );
}
