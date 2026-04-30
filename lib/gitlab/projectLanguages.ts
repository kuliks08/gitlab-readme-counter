import { gitlabGetJson } from "./http";

const LANGUAGE_FETCH_CONCURRENCY = 8;

export async function fetchProjectLanguages(
  projectId: number,
): Promise<Record<string, number>> {
  const result = await gitlabGetJson<unknown>(
    `projects/${projectId}/languages`,
  );
  if (!result.ok) {
    return {};
  }
  const data = result.data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    }
  }
  return out;
}

/** Несколько параллельных запросов к `/languages`, чтобы уложиться в лимит времени serverless. */
export async function fetchProjectLanguagesMany(
  projectIds: number[],
  concurrency = LANGUAGE_FETCH_CONCURRENCY,
): Promise<Record<string, number>[]> {
  const maps: Record<string, number>[] = [];
  for (let i = 0; i < projectIds.length; i += concurrency) {
    const chunk = projectIds.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map((id) => fetchProjectLanguages(id)),
    );
    for (const m of batch) {
      if (Object.keys(m).length > 0) {
        maps.push(m);
      }
    }
  }
  return maps;
}
