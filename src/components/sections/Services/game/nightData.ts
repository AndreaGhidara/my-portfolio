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
const MINUTES_PER_STEP = 3;
export const NIGHT_MINUTES = 8 * 60;
export const NIGHT_STEPS = NIGHT_MINUTES / MINUTES_PER_STEP;
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

export const minuteOfStep = (step: number) => step * MINUTES_PER_STEP;

/** «23:40», «07:00»: l'ora del muro, dai minuti dalle 23. */
export function clockTime(minute: number): string {
  const hour = (23 + Math.floor(minute / 60)) % 24;
  return `${pad2(hour)}:${pad2(minute % 60)}`;
}

type Outage = readonly [start: number, end: number];

/** I pezzi di notte col sito giu': uno per ogni colpo arrivato a chi non era pronto. */
export function outages(ready: ReadonlySet<NightItem>, now: number): Outage[] {
  return NIGHT_EVENTS.filter((e) => e.minute <= now && !ready.has(e.item)).map(
    (e) => [e.minute, Math.min(NIGHT_MINUTES, e.minute + e.damage)] as const,
  );
}

/**
 * La striscia fino ad adesso, a pezzi verdi e rossi, in minuti. Due tagli che
 * si sovrappongono fanno un rosso solo: il sito non va giu' due volte.
 */
export function uptimeStrip(cuts: readonly Outage[], now: number): { down: boolean; minutes: number }[] {
  const strip: { down: boolean; minutes: number }[] = [];
  let cursor = 0;
  for (const [start, end] of [...cuts].sort((a, b) => a[0] - b[0])) {
    if (start >= now) break;
    if (start > cursor) strip.push({ down: false, minutes: start - cursor });
    const from = Math.max(start, cursor);
    const a = Math.min(end, now);
    if (a > from) strip.push({ down: true, minutes: a - from });
    cursor = Math.max(cursor, a);
  }
  if (now > cursor) strip.push({ down: false, minutes: now - cursor });
  return strip;
}

/** Le ore col sito su, su otto, a un decimale. */
export function hoursOnline(ready: ReadonlySet<NightItem>): number {
  const down = uptimeStrip(outages(ready, NIGHT_MINUTES), NIGHT_MINUTES)
    .filter((p) => p.down)
    .reduce((sum, p) => sum + p.minutes, 0);
  return Math.round(((NIGHT_MINUTES - down) / 60) * 10) / 10;
}
