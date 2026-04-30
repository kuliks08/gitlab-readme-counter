import { unstable_cache } from "next/cache";
import {
  mergeLanguageMaps,
  normalizePercents,
} from "@/lib/aggregate/topLanguages";
import { MAX_LANGUAGE_FETCH_PROJECTS } from "@/lib/gitlab/constants";
import { fetchProjectLanguagesMany } from "@/lib/gitlab/projectLanguages";
import { listUserProjectsWithStatus } from "@/lib/gitlab/projects";
import { getUserByUsername } from "@/lib/gitlab/users";
import { statsDataRevalidateSeconds } from "./dataRevalidate";

export type TopLangsNormalizedResult =
  | { ok: true; normalized: ReturnType<typeof normalizePercents> }
  | { ok: false; error: "not_found" | "gitlab_api" };

async function fetchTopLangsNormalizedRaw(
  username: string,
): Promise<TopLangsNormalizedResult> {
  const trimmed = username.trim();
  if (!trimmed) {
    return { ok: false, error: "not_found" };
  }

  const user = await getUserByUsername(trimmed);
  if (!user) {
    return { ok: false, error: "not_found" };
  }

  const projectsResult = await listUserProjectsWithStatus(user.id);
  if (!projectsResult.ok) {
    return { ok: false, error: "gitlab_api" };
  }

  const slice = projectsResult.projects.slice(0, MAX_LANGUAGE_FETCH_PROJECTS);
  const maps = await fetchProjectLanguagesMany(slice.map((p) => p.id));
  const merged = mergeLanguageMaps(maps);
  const normalized = normalizePercents(merged);
  return { ok: true, normalized };
}

export async function loadTopLangsNormalizedCached(
  username: string,
): Promise<TopLangsNormalizedResult> {
  const key = username.trim();
  if (!key) {
    return { ok: false, error: "not_found" };
  }
  const cacheKey = key.toLowerCase();
  return unstable_cache(
    async () => fetchTopLangsNormalizedRaw(key),
    ["gitlab-top-langs-v1", cacheKey],
    { revalidate: statsDataRevalidateSeconds() },
  )();
}
