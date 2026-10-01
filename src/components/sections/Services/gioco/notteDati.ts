import { due } from "@/lib/formato";
import type { IconaCloud } from "./icone";

/**
 * I numeri della notte del livello 4: quando succede cosa, quanto resta giu'
 * il sito se non era pronto, e i conti della striscia e del resoconto. I
 * testi stanno in services.gioco.notte; qui solo il tempo.
 *
 * Il tempo e' in minuti dalle 23 (0..480) e corre a passi interi, non in ore
 * con la virgola: sommando 0,05 per 160 volte non si arriva alle 7 esatte.
 */

/** Un passo ogni 60 ms, tre minuti di notte a passo: otto ore in 9,6 s. */
export const PASSO_MS = 60;
const MINUTI_A_PASSO = 3;
export const NOTTE_MINUTI = 8 * 60;
export const PASSI = NOTTE_MINUTI / MINUTI_A_PASSO;
export const DURATA_NOTTE = PASSI * PASSO_MS;

/** Le sei voci, nell'ordine degli interruttori e della notte. */
export const VOCI = ["dominio", "sicurezza", "dati", "copie", "dove", "velocita"] as const satisfies readonly IconaCloud[];
export type Voce = (typeof VOCI)[number];

/** Quando arriva il colpo (minuti dalle 23) e quanti minuti di giu' fa a chi non e' pronto. */
export const EVENTI: readonly { voce: Voce; minuto: number; danno: number }[] = [
  { voce: "dominio", minuto: 40, danno: 180 },
  { voce: "sicurezza", minuto: 130, danno: 90 },
  { voce: "dati", minuto: 215, danno: 120 },
  { voce: "copie", minuto: 290, danno: 120 },
  { voce: "dove", minuto: 415, danno: 48 },
  { voce: "velocita", minuto: 455, danno: 24 },
];

export const minutoDelPasso = (passo: number) => passo * MINUTI_A_PASSO;

/** «23:40», «07:00»: l'ora del muro, dai minuti dalle 23. */
export function oraDi(minuto: number): string {
  const ore = (23 + Math.floor(minuto / 60)) % 24;
  return `${due(ore)}:${due(minuto % 60)}`;
}

type Taglio = readonly [inizio: number, fine: number];

/** I pezzi di notte col sito giu': uno per ogni colpo arrivato a chi non era pronto. */
export function tagli(pronti: ReadonlySet<Voce>, adesso: number): Taglio[] {
  return EVENTI.filter((e) => e.minuto <= adesso && !pronti.has(e.voce)).map(
    (e) => [e.minuto, Math.min(NOTTE_MINUTI, e.minuto + e.danno)] as const,
  );
}

/**
 * La striscia fino ad adesso, a pezzi verdi e rossi, in minuti. Due tagli che
 * si sovrappongono fanno un rosso solo: il sito non va giu' due volte.
 */
export function striscia(pezzi: readonly Taglio[], adesso: number): { giu: boolean; minuti: number }[] {
  const fuori: { giu: boolean; minuti: number }[] = [];
  let fin = 0;
  for (const [inizio, fine] of [...pezzi].sort((a, b) => a[0] - b[0])) {
    if (inizio >= adesso) break;
    if (inizio > fin) fuori.push({ giu: false, minuti: inizio - fin });
    const da = Math.max(inizio, fin);
    const a = Math.min(fine, adesso);
    if (a > da) fuori.push({ giu: true, minuti: a - da });
    fin = Math.max(fin, a);
  }
  if (adesso > fin) fuori.push({ giu: false, minuti: adesso - fin });
  return fuori;
}

/** Le ore col sito su, su otto, a un decimale. */
export function oreOnline(pronti: ReadonlySet<Voce>): number {
  const giu = striscia(tagli(pronti, NOTTE_MINUTI), NOTTE_MINUTI)
    .filter((p) => p.giu)
    .reduce((somma, p) => somma + p.minuti, 0);
  return Math.round(((NOTTE_MINUTI - giu) / 60) * 10) / 10;
}
