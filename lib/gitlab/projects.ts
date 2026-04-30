import {
  MAX_PROJECT_PAGES,
  PROJECTS_PER_PAGE,
} from "./constants";
import { gitlabGetJson } from "./http";

export type GitLabUserProjects = {
  id: number;
  path_with_namespace?: string;
  star_count?: number;
}[];

function parseProjectRow(
  raw: unknown,
): { id: number; path_with_namespace?: string; star_count?: number } | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (typeof id !== "number" || !Number.isFinite(id)) {
    return null;
  }
  const row: {
    id: number;
    path_with_namespace?: string;
    star_count?: number;
  } = { id };

  if (
    "path_with_namespace" in o &&
    typeof o.path_with_namespace === "string"
  ) {
    row.path_with_namespace = o.path_with_namespace;
  }
  if (
    "star_count" in o &&
    typeof o.star_count === "number" &&
    Number.isFinite(o.star_count)
  ) {
    row.star_count = o.star_count;
  }

  return row;
}

function mergeStarCount(
  a: number | undefined,
  b: number | undefined,
): number | undefined {
  const hasA = typeof a === "number" && Number.isFinite(a);
  const hasB = typeof b === "number" && Number.isFinite(b);
  if (hasA && hasB) {
    return Math.max(a!, b!);
  }
  if (hasA) {
    return a;
  }
  if (hasB) {
    return b;
  }
  return undefined;
}

function mergeProjectRows(
  into: Map<number, GitLabUserProjects[number]>,
  rows: GitLabUserProjects,
): void {
  for (const row of rows) {
    const prev = into.get(row.id);
    if (!prev) {
      into.set(row.id, { ...row });
      continue;
    }
    into.set(row.id, {
      id: row.id,
      path_with_namespace:
        row.path_with_namespace ?? prev.path_with_namespace,
      star_count: mergeStarCount(prev.star_count, row.star_count),
    });
  }
}

/** GitLab: users/:id/projects — только персональный namespace; contributed_projects — вклад в видимые репо (см. доку API). */
async function listUserProjectsFromEndpoint(
  userId: number,
  endpoint: "projects" | "contributed_projects",
): Promise<
  { ok: true; projects: GitLabUserProjects } | { ok: false }
> {
  const pages = Array.from({ length: MAX_PROJECT_PAGES }, (_, idx) => idx + 1);
  const results = await Promise.all(
    pages.map((page) =>
      gitlabGetJson<unknown[]>(
        `users/${userId}/${endpoint}?per_page=${PROJECTS_PER_PAGE}&page=${page}`,
      ),
    ),
  );

  const out: GitLabUserProjects = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (!result.ok) {
      if (i === 0) {
        return { ok: false };
      }
      break;
    }

    const list = result.data;
    if (!Array.isArray(list)) {
      if (i === 0) {
        return { ok: false };
      }
      break;
    }

    for (const item of list) {
      const row = parseProjectRow(item);
      if (row !== null) {
        out.push(row);
      }
    }

    if (list.length < PROJECTS_PER_PAGE) {
      break;
    }
  }

  return { ok: true, projects: out };
}

export async function listUserProjectsWithStatus(
  userId: number,
): Promise<
  { ok: true; projects: GitLabUserProjects } | { ok: false }
> {
  const [personal, contributed] = await Promise.all([
    listUserProjectsFromEndpoint(userId, "projects"),
    listUserProjectsFromEndpoint(userId, "contributed_projects"),
  ]);

  if (!personal.ok && !contributed.ok) {
    return { ok: false };
  }

  const byId = new Map<number, GitLabUserProjects[number]>();
  if (personal.ok) {
    mergeProjectRows(byId, personal.projects);
  }
  if (contributed.ok) {
    mergeProjectRows(byId, contributed.projects);
  }

  return { ok: true, projects: Array.from(byId.values()) };
}

export async function listUserProjects(userId: number): Promise<GitLabUserProjects> {
  const r = await listUserProjectsWithStatus(userId);
  if (!r.ok) {
    return [];
  }
  return r.projects;
}
