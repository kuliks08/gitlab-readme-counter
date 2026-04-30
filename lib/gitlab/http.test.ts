import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { gitlabGetJson } from "./http";

describe("gitlabGetJson", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITLAB_TOKEN;
  });

  it("prefixes GITLAB_API_BASE and builds correct URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await gitlabGetJson<{ id: number }>("users?username=test");

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url.startsWith("https://gitlab.com/api/v4/users?username=test")).toBe(
      true,
    );
  });

  it("sends Accept and PRIVATE-TOKEN when GITLAB_TOKEN is set", async () => {
    process.env.GITLAB_TOKEN = "secret-token";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await gitlabGetJson("/projects");

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const h = init.headers as Record<string, string>;
    expect(h.Accept).toBe("application/json");
    expect(h["PRIVATE-TOKEN"]).toBe("secret-token");
  });

  it("returns network_error on fetch throw", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("boom"));

    const out = await gitlabGetJson("x");

    expect(out).toEqual({
      ok: false,
      err: { status: 0, body: "network_error" },
    });
  });

  it("returns sliced body on non-ok HTTP", async () => {
    const long = "x".repeat(600);
    vi.mocked(fetch).mockResolvedValue(new Response(long, { status: 404 }));

    const out = await gitlabGetJson("missing");

    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.err.status).toBe(404);
      expect(out.err.body.length).toBe(512);
    }
  });

  it("returns invalid_json on 200 with bad JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("not json", { status: 200 }));

    const out = await gitlabGetJson("y");

    expect(out).toEqual({
      ok: false,
      err: { status: 200, body: "invalid_json" },
    });
  });

  it("strips leading slashes from pathSearch", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));

    await gitlabGetJson("//groups/1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toBe("https://gitlab.com/api/v4/groups/1");
  });
});
