import { describe, it, expect, vi } from "vitest";
import { createFetcher } from "../fetcher";

const NOW = Date.parse("2026-09-28T12:00:00Z");
const response = (body: unknown, date: string, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", date } });
const headers = () => ({ Accept: "application/json" });

describe("chiedere una fonte", () => {
  it("una risposta di meno di tre ore si usa com'e': una chiamata sola, con la cache di un'ora", async () => {
    const fetchFn = vi.fn(async () => response({ n: 1 }, "Mon, 28 Sep 2026 10:30:00 GMT"));
    const fetcher = createFetcher(fetchFn, headers, () => NOW);
    expect(await fetcher("https://x.test/a")).toEqual({ body: { n: 1 }, date: "Mon, 28 Sep 2026 10:30:00 GMT" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate?: number } }];
    expect(init.next).toEqual({ revalidate: 3600 });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("piu' vecchia di tre ore (la cache servita scaduta a chi passa dopo giorni): si richiede senza cache", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(response({ n: "stale" }, "Fri, 25 Sep 2026 09:00:00 GMT"))
      .mockResolvedValueOnce(response({ n: "fresh" }, "Mon, 28 Sep 2026 12:00:00 GMT"));
    const fetcher = createFetcher(fetchFn, headers, () => NOW);
    expect(await fetcher("https://x.test/a")).toEqual({ body: { n: "fresh" }, date: "Mon, 28 Sep 2026 12:00:00 GMT" });
    const [, init] = fetchFn.mock.calls[1] as [string, RequestInit & { next?: unknown }];
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("se la richiesta fresca fallisce, meglio la vecchia che niente", async () => {
    for (const second of [
      () => Promise.reject(new Error("timeout")),
      () => Promise.resolve(response({}, "Mon, 28 Sep 2026 12:00:00 GMT", 429)),
    ]) {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(response({ n: "stale" }, "Fri, 25 Sep 2026 09:00:00 GMT"))
        .mockImplementationOnce(second);
      const fetcher = createFetcher(fetchFn, headers, () => NOW);
      expect((await fetcher("https://x.test/a")).body).toEqual({ n: "stale" });
    }
  });

  it("una risposta non ok e' una fonte giu'", async () => {
    const fetcher = createFetcher(async () => response({}, "Mon, 28 Sep 2026 12:00:00 GMT", 403), headers, () => NOW);
    await expect(fetcher("https://x.test/a")).rejects.toThrow("403");
  });
});
