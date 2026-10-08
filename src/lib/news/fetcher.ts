import type { Fetcher } from "./collector";

const ONE_HOUR = 3600;
const TIMEOUT_MS = 4000;
/** Oltre questa eta' una risposta in cache non vale piu' come «della settimana». */
export const STALE_MS = 3 * 3_600_000;

type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Chi va in rete per la route. Ogni fonte ha la sua cache di un'ora e nessuna
 * attesa oltre i 4s; una risposta non ok e' una fonte giu', e non entra in cache.
 *
 * Con poche visite la cache di Next serve la copia scaduta e si rinnova dietro:
 * chi passa dopo giorni vedrebbe notizie di giorni prima. Se la Date della
 * risposta ha piu' di tre ore, si richiede senza cache e si usa quella; se la
 * richiesta fresca non va, resta la vecchia.
 */
export function createFetcher(
  fetchFn: FetchFn,
  headersFor: (url: string) => Record<string, string>,
  now: () => number = Date.now,
): Fetcher {
  const read = async (r: Response) => ({ body: (await r.json()) as unknown, date: r.headers.get("date") });
  return async (url) => {
    const headers = headersFor(url);
    const r = await fetchFn(url, { headers, next: { revalidate: ONE_HOUR }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const sentAt = Date.parse(r.headers.get("date") ?? "");
    if (Number.isNaN(sentAt) || now() - sentAt <= STALE_MS) return read(r);
    try {
      const fresh = await fetchFn(url, { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (fresh.ok) return await read(fresh);
    } catch {
      // La vecchia e' meglio di niente.
    }
    return read(r);
  };
}
