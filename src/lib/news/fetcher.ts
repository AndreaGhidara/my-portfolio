import type { Fetcher } from "./collector";

const UN_ORA = 3600;
const PAZIENZA_MS = 4000;
/** Oltre questa eta' una risposta in cache non vale piu' come «della settimana». */
export const STALE_MS = 3 * 3_600_000;

type Prendi = (url: string, init: RequestInit) => Promise<Response>;

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
  prendi: Prendi,
  intestazioni: (url: string) => Record<string, string>,
  adesso: () => number = Date.now,
): Fetcher {
  const leggi = async (r: Response) => ({ body: (await r.json()) as unknown, date: r.headers.get("date") });
  return async (url) => {
    const headers = intestazioni(url);
    const r = await prendi(url, { headers, next: { revalidate: UN_ORA }, signal: AbortSignal.timeout(PAZIENZA_MS) });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const quando = Date.parse(r.headers.get("date") ?? "");
    if (Number.isNaN(quando) || adesso() - quando <= STALE_MS) return leggi(r);
    try {
      const fresca = await prendi(url, { headers, cache: "no-store", signal: AbortSignal.timeout(PAZIENZA_MS) });
      if (fresca.ok) return await leggi(fresca);
    } catch {
      // La vecchia e' meglio di niente.
    }
    return leggi(r);
  };
}
