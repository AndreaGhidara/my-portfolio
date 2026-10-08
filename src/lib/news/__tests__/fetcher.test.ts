import { describe, it, expect, vi } from "vitest";
import { creaChiedi } from "../fetcher";

const ADESSO = Date.parse("2026-09-28T12:00:00Z");
const risposta = (corpo: unknown, data: string, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json", date: data } });
const intestazioni = () => ({ Accept: "application/json" });

describe("chiedere una fonte", () => {
  it("una risposta di meno di tre ore si usa com'e': una chiamata sola, con la cache di un'ora", async () => {
    const prendi = vi.fn(async () => risposta({ n: 1 }, "Mon, 28 Sep 2026 10:30:00 GMT"));
    const chiedi = creaChiedi(prendi, intestazioni, () => ADESSO);
    expect(await chiedi("https://x.test/a")).toEqual({ corpo: { n: 1 }, data: "Mon, 28 Sep 2026 10:30:00 GMT" });
    expect(prendi).toHaveBeenCalledTimes(1);
    const [, init] = prendi.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate?: number } }];
    expect(init.next).toEqual({ revalidate: 3600 });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("piu' vecchia di tre ore (la cache servita scaduta a chi passa dopo giorni): si richiede senza cache", async () => {
    const prendi = vi
      .fn()
      .mockResolvedValueOnce(risposta({ n: "vecchia" }, "Fri, 25 Sep 2026 09:00:00 GMT"))
      .mockResolvedValueOnce(risposta({ n: "fresca" }, "Mon, 28 Sep 2026 12:00:00 GMT"));
    const chiedi = creaChiedi(prendi, intestazioni, () => ADESSO);
    expect(await chiedi("https://x.test/a")).toEqual({ corpo: { n: "fresca" }, data: "Mon, 28 Sep 2026 12:00:00 GMT" });
    const [, init] = prendi.mock.calls[1] as [string, RequestInit & { next?: unknown }];
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("se la richiesta fresca fallisce, meglio la vecchia che niente", async () => {
    for (const seconda of [
      () => Promise.reject(new Error("timeout")),
      () => Promise.resolve(risposta({}, "Mon, 28 Sep 2026 12:00:00 GMT", 429)),
    ]) {
      const prendi = vi
        .fn()
        .mockResolvedValueOnce(risposta({ n: "vecchia" }, "Fri, 25 Sep 2026 09:00:00 GMT"))
        .mockImplementationOnce(seconda);
      const chiedi = creaChiedi(prendi, intestazioni, () => ADESSO);
      expect((await chiedi("https://x.test/a")).corpo).toEqual({ n: "vecchia" });
    }
  });

  it("una risposta non ok e' una fonte giu'", async () => {
    const chiedi = creaChiedi(async () => risposta({}, "Mon, 28 Sep 2026 12:00:00 GMT", 403), intestazioni, () => ADESSO);
    await expect(chiedi("https://x.test/a")).rejects.toThrow("403");
  });
});
