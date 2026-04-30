import { GITLAB_API_BASE } from "./constants";

export async function gitlabGetJson<T>(
  pathSearch: string,
): Promise<
  | { ok: true; data: T }
  | { ok: false; err: { status: number; body: string } }
> {
  const trimmed = pathSearch.replace(/^\/+/, "");
  const url = `${GITLAB_API_BASE}/${trimmed}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const token = process.env.GITLAB_TOKEN;
  if (token) {
    headers["PRIVATE-TOKEN"] = token;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    return { ok: false, err: { status: 0, body: "network_error" } };
  }

  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      err: { status: res.status, body: text.slice(0, 512) },
    };
  }

  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      err: { status: res.status, body: "invalid_json" },
    };
  }
}
