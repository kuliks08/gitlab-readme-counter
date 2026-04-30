import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./http", () => ({
  gitlabGetJson: vi.fn(),
}));

import { gitlabGetJson } from "./http";
import { fetchProjectLanguages } from "./projectLanguages";

describe("fetchProjectLanguages", () => {
  beforeEach(() => {
    vi.mocked(gitlabGetJson).mockReset();
  });

  it("returns parsed map when API succeeds", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: true,
      data: { TypeScript: 100, Rust: 50 },
    });

    const m = await fetchProjectLanguages(7);

    expect(gitlabGetJson).toHaveBeenCalledWith("projects/7/languages");
    expect(m).toEqual({ TypeScript: 100, Rust: 50 });
  });

  it("returns {} when request fails", async () => {
    vi.mocked(gitlabGetJson).mockResolvedValue({
      ok: false,
      err: { status: 500, body: "err" },
    });

    expect(await fetchProjectLanguages(1)).toEqual({});
  });
});
