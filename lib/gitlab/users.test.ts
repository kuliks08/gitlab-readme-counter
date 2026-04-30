import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./http", () => ({
  gitlabGetJson: vi.fn(),
}));

import { gitlabGetJson } from "./http";
import { getUserByUsername } from "./users";

describe("getUserByUsername", () => {
  beforeEach(() => {
    vi.mocked(gitlabGetJson).mockReset();
  });

  it("returns parsed user when API returns one match", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: true,
      data: [
        {
          id: 42,
          username: "alice",
          name: "Alice Example",
        },
      ],
    });

    const user = await getUserByUsername("alice");

    expect(user).toEqual({
      id: 42,
      username: "alice",
      name: "Alice Example",
    });
    expect(gitlabGetJson).toHaveBeenCalledWith("users?username=alice");
  });

  it("uses username as name when name is missing", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: true,
      data: [{ id: 1, username: "bob" }],
    });

    const user = await getUserByUsername("bob");

    expect(user).toEqual({ id: 1, username: "bob", name: "bob" });
  });

  it("returns null when API returns empty array", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({ ok: true, data: [] });

    expect(await getUserByUsername("nobody")).toBeNull();
  });

  it("returns null when request fails", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: false,
      err: { status: 404, body: "not found" },
    });

    expect(await getUserByUsername("x")).toBeNull();
  });

  it("returns null when payload is invalid", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: true,
      data: [{ username: "no-id" }],
    });

    expect(await getUserByUsername("no-id")).toBeNull();
  });
});
