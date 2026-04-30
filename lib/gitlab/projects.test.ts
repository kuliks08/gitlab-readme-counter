import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./http", () => ({
  gitlabGetJson: vi.fn(),
}));

import { gitlabGetJson } from "./http";
import { MAX_PROJECT_PAGES, PROJECTS_PER_PAGE } from "./constants";
import { listUserProjects } from "./projects";

function dummyProjects(count: number, offset = 0): unknown[] {
  return Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    path_with_namespace: `g/p${offset + i + 1}`,
    star_count: 0,
  }));
}

function pathKind(path: string): "personal" | "contributed" | "unknown" {
  if (path.includes("/contributed_projects")) {
    return "contributed";
  }
  if (path.includes(`/projects?`) || path.endsWith("/projects")) {
    return "personal";
  }
  return "unknown";
}

describe("listUserProjects", () => {
  const userId = 99;

  beforeEach(() => {
    vi.mocked(gitlabGetJson).mockReset();
  });

  it("single partial page: оба списка по одному запросу", async () => {
    const chunk = dummyProjects(5);
    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      if (pathKind(path) === "unknown") {
        return { ok: false, err: { status: 0, body: "bad path" } };
      }
      return { ok: true, data: chunk };
    });

    const projects = await listUserProjects(userId);

    expect(gitlabGetJson).toHaveBeenCalledTimes(MAX_PROJECT_PAGES * 2);
    for (let page = 1; page <= MAX_PROJECT_PAGES; page++) {
      expect(gitlabGetJson).toHaveBeenCalledWith(
        `users/${userId}/projects?per_page=${PROJECTS_PER_PAGE}&page=${page}`,
      );
      expect(gitlabGetJson).toHaveBeenCalledWith(
        `users/${userId}/contributed_projects?per_page=${PROJECTS_PER_PAGE}&page=${page}`,
      );
    }
    expect(projects).toHaveLength(5);
    expect(projects[0]?.id).toBe(1);
  });

  it("два полных личных страницы + один частичный список вкладов", async () => {
    const firstPersonal = dummyProjects(PROJECTS_PER_PAGE, 0);
    const secondPersonal = dummyProjects(5, PROJECTS_PER_PAGE);
    const contributed = dummyProjects(3, 1000);

    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      const kind = pathKind(path);
      if (kind === "personal") {
        if (path.includes("page=1")) {
          return { ok: true, data: firstPersonal };
        }
        if (path.includes("page=2")) {
          return { ok: true, data: secondPersonal };
        }
        return { ok: true, data: [] };
      }
      if (kind === "contributed") {
        return { ok: true, data: contributed };
      }
      return { ok: false, err: { status: 0, body: "?" } };
    });

    const projects = await listUserProjects(userId);

    expect(projects).toHaveLength(PROJECTS_PER_PAGE + 5 + 3);
  });

  it("оба первых запроса падают → пустой массив", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: false,
      err: { status: 500, body: "error" },
    });

    const projects = await listUserProjects(userId);

    expect(projects).toEqual([]);
    expect(gitlabGetJson).toHaveBeenCalledTimes(MAX_PROJECT_PAGES * 2);
  });

  it("личные проекты недоступны, вклад доступен → только вклад", async () => {
    const contributed = dummyProjects(2, 0);
    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      if (pathKind(path) === "personal") {
        return { ok: false, err: { status: 403, body: "no" } };
      }
      return { ok: true, data: contributed };
    });

    const projects = await listUserProjects(userId);

    expect(projects).toHaveLength(2);
    expect(gitlabGetJson).toHaveBeenCalledTimes(MAX_PROJECT_PAGES * 2);
  });

  it("вторая страница личных падает → отдаёт накопленное + вклад", async () => {
    const first = dummyProjects(PROJECTS_PER_PAGE, 0);
    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      const kind = pathKind(path);
      if (kind === "contributed") {
        return { ok: true, data: [] };
      }
      if (kind === "personal") {
        if (path.includes("page=1")) {
          return { ok: true, data: first };
        }
        return {
          ok: false,
          err: { status: 503, body: "down" },
        };
      }
      return { ok: false, err: { status: 0, body: "?" } };
    });

    const projects = await listUserProjects(userId);

    expect(projects).toHaveLength(PROJECTS_PER_PAGE);
  });

  it("склеивает одинаковый id из двух источников без дубликата", async () => {
    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      const shared = [{ id: 1, path_with_namespace: "u/a", star_count: 3 }];
      if (pathKind(path) === "personal") {
        return { ok: true, data: shared };
      }
      return {
        ok: true,
        data: [{ id: 1, path_with_namespace: "u/a", star_count: 5 }],
      };
    });

    const projects = await listUserProjects(userId);

    expect(projects).toEqual([{ id: 1, path_with_namespace: "u/a", star_count: 5 }]);
  });

  it("пропускает строки без числового id", async () => {
    vi.mocked(gitlabGetJson).mockImplementation(async (path: string) => {
      const data = [{ bad: true }, { id: 7, path_with_namespace: "a/b" }];
      return { ok: true, data };
    });

    const projects = await listUserProjects(userId);

    expect(projects).toEqual([{ id: 7, path_with_namespace: "a/b" }]);
  });
});
