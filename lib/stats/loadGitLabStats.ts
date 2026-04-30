import { totalStars } from "@/lib/aggregate/totalStars";
import type { ProfileCalendarData } from "@/lib/gitlab/profileCalendar";
import { fetchProfileCalendar } from "@/lib/gitlab/profileCalendar";
import { listUserProjectsWithStatus } from "@/lib/gitlab/projects";
import type { GitLabUser } from "@/lib/gitlab/users";
import { getUserByUsername } from "@/lib/gitlab/users";

export type LoadGitLabStatsOk = {
  ok: true;
  user: GitLabUser;
  projectCount: number;
  starsTotal: number;
  profileCalendar: ProfileCalendarData | null;
};

export type LoadGitLabStatsErr = {
  ok: false;
  error: "not_found" | "gitlab_api";
};

export type LoadGitLabStatsResult = LoadGitLabStatsOk | LoadGitLabStatsErr;

export async function loadGitLabStats(
  username: string,
): Promise<LoadGitLabStatsResult> {
  const trimmed = username.trim();
  if (!trimmed) {
    return { ok: false, error: "not_found" };
  }

  const user = await getUserByUsername(trimmed);
  if (!user) {
    return { ok: false, error: "not_found" };
  }

  const [projectsResult, profileCalendar] = await Promise.all([
    listUserProjectsWithStatus(user.id),
    fetchProfileCalendar(user.username),
  ]);

  if (!projectsResult.ok) {
    return { ok: false, error: "gitlab_api" };
  }

  return {
    ok: true,
    user,
    projectCount: projectsResult.projects.length,
    starsTotal: totalStars(projectsResult.projects),
    profileCalendar,
  };
}
