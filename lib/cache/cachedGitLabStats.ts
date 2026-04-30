import { unstable_cache } from "next/cache";
import type { LoadGitLabStatsResult } from "@/lib/stats/loadGitLabStats";
import { loadGitLabStats } from "@/lib/stats/loadGitLabStats";
import { statsDataRevalidateSeconds } from "./dataRevalidate";

export async function loadGitLabStatsCached(
  username: string,
): Promise<LoadGitLabStatsResult> {
  const key = username.trim();
  if (!key) {
    return { ok: false, error: "not_found" };
  }
  const cacheKey = key.toLowerCase();
  return unstable_cache(
    async () => loadGitLabStats(key),
    ["gitlab-stats-v1", cacheKey],
    { revalidate: statsDataRevalidateSeconds() },
  )();
}
