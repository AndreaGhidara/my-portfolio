import { pad2 } from "@/lib/format";
import type { CloudIcon } from "./icons";

/**
 * I numeri della notte del livello 4: quando succede cosa, quanto resta giu'
 * il sito se non era pronto, e i conti della striscia e del resoconto. I
 * testi stanno in services.gioco.notte; qui solo il tempo.
 *
 * Il tempo e' in minuti dalle 23 (0..480) e corre a passi interi, non in ore
 * con la virgola: sommando 0,05 per 160 volte non si arriva alle 7 esatte.
 */

/** Un passo ogni 60 ms, tre minuti di notte a passo: otto ore in 9,6 s. */
export const STEP_MS = 60;
const MINUTI_A_PASSO = 3;
export const NIGHT_MINUTES = 8 * 60;
export const NIGHT_STEPS = NIGHT_MINUTES / MINUTI_A_PASSO;
export const NIGHT_DURATION = NIGHT_STEPS * STEP_MS;

/** Le sei voci, nell'ordine degli interruttori e della notte. */
export const NIGHT_ITEMS = ["dominio", "sicurezza", "dati", "copie", "dove", "velocita"] as const satisfies readonly CloudIcon[];
export type NightItem = (typeof NIGHT_ITEMS)[number];

/** Quando arriva il colpo (minuti dalle 23) e quanti minuti di giu' fa a chi non e' pronto. */
export const NIGHT_EVENTS: readonly { item: NightItem; minute: number; damage: number }[] = [
  { item: "dominio", minute: 40, damage: 180 },
  { item: "sicurezza", minute: 130, damage: 90 },
  { item: "dati", minute: 215, damage: 120 },
  { item: "copie", minute: 290, damage: 120 },
  { item: "dove", minute: 415, damage: 48 },
  { item: "velocita", minute: 455, damage: 24 },
];

export const minuteOfStep = (passo: number) => passo * MINUTI_A_PASSO;

/** «23:40», «07:00»: l'ora del muro, dai minuti dalle 23. */
export function clockTime(minuto: number): string {
  const ore = (23 + Math.floor(minuto / 60)) % 24;
  return `${pad2(ore)}:${pad2(minuto % 60)}`;
}

type Taglio = readonly [inizio: number, fine: number];

/** I pezzi di notte col sito giu': uno per ogni colpo arrivato a chi non era pronto. */
export function outages(pronti: ReadonlySet<NightItem>, adesso: number): Taglio[] {
  return NIGHT_EVENTS.filter((e) => e.minute <= adesso && !pronti.has(e.item)).map(
    (e) => [e.minute, Math.min(NIGHT_MINUTES, e.minute + e.damage)] as const,
  );
}

/**
 * La striscia fino ad adesso, a pezzi verdi e rossi, in minuti. Due tagli che
 * si sovrappongono fanno un rosso solo: il sito non va giu' due volte.
 */
export function uptimeStrip(pezzi: readonly Taglio[], adesso: number): { down: boolean; minutes: number }[] {
  const fuori: { down: boolean; minutes: number }[] = [];
  let fin = 0;
  for (const [inizio, fine] of [...pezzi].sort((a, b) => a[0] - b[0])) {
    if (inizio >= adesso) break;
    if (inizio > fin) fuori.push({ down: false, minutes: inizio - fin });
    const da = Math.max(inizio, fin);
    const a = Math.min(fine, adesso);
    if (a > da) fuori.push({ down: true, minutes: a - da });
    fin = Math.max(fin, a);
  }
  if (adesso > fin) fuori.push({ down: false, minutes: adesso - fin });
  return fuori;
}

/** Le ore col sito su, su otto, a un decimale. */
export function hoursOnline(pronti: ReadonlySet<NightItem>): number {
  const giu = uptimeStrip(outages(pronti, NIGHT_MINUTES), NIGHT_MINUTES)
    .filter((p) => p.down)
    .reduce((somma, p) => somma + p.minutes, 0);
  return Math.round(((NIGHT_MINUTES - giu) / 60) * 10) / 10;
}
