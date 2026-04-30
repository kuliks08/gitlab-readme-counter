import { gitlabGetJson } from "./http";

export type GitLabUser = { id: number; username: string; name: string };

export async function getUserByUsername(
  username: string,
): Promise<GitLabUser | null> {
  const result = await gitlabGetJson<unknown[]>(
    `users?username=${encodeURIComponent(username)}`,
  );

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  const first = result.data[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }

  const o = first as Record<string, unknown>;
  const id = o.id;
  const uname = o.username;

  if (typeof id !== "number" || !Number.isFinite(id)) {
    return null;
  }
  if (typeof uname !== "string") {
    return null;
  }

  const name = typeof o.name === "string" ? o.name : uname;
  return { id, username: uname, name };
}
