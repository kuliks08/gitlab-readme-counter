import {
  mergeLanguageMaps,
  normalizePercents,
  takeTop,
} from "@/lib/aggregate/topLanguages";
import { MAX_LANGUAGE_FETCH_PROJECTS } from "@/lib/gitlab/constants";
import { fetchProjectLanguagesMany } from "@/lib/gitlab/projectLanguages";
import { listUserProjectsWithStatus } from "@/lib/gitlab/projects";
import { getUserByUsername } from "@/lib/gitlab/users";
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

  const user = await getUserByUsername(username);
  if (!user) {
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Top Languages",
        message: "User not found",
        theme,
        hideBorder,
      }),
      CACHE_ERR,
    );
  }

  const projectsResult = await listUserProjectsWithStatus(user.id);
  if (!projectsResult.ok) {
    return svgResponse(
      renderErrorCardSvg({
        title: "GitLab Top Languages",
        message: "GitLab API error",
        theme,
        hideBorder,
      }),
      CACHE_ERR,
    );
  }

  const slice = projectsResult.projects.slice(0, MAX_LANGUAGE_FETCH_PROJECTS);
  const maps = await fetchProjectLanguagesMany(slice.map((p) => p.id));

  const merged = mergeLanguageMaps(maps);
  const normalized = normalizePercents(merged);
  const top = takeTop(normalized, parseLangsCount(sp));
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
