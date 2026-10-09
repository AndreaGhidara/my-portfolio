import { pad2 } from "@/lib/format";
import type { CloudIcon } from "./icons";

// Il tempo e' in minuti dalle 23 e corre a passi interi: sommando 0,05 ore per
// 160 volte non si arriva alle 7 esatte. Tre minuti ogni 60 ms: otto ore in 9,6 s.
export const STEP_MS = 60;
const MINUTES_PER_STEP = 3;
export const NIGHT_MINUTES = 8 * 60;
export const NIGHT_STEPS = NIGHT_MINUTES / MINUTES_PER_STEP;
export const NIGHT_DURATION = NIGHT_STEPS * STEP_MS;

export const NIGHT_ITEMS = ["dominio", "sicurezza", "dati", "copie", "dove", "velocita"] as const satisfies readonly CloudIcon[];
export type NightItem = (typeof NIGHT_ITEMS)[number];

// `damage`: i minuti di sito giu' per chi non era pronto.
export const NIGHT_EVENTS: readonly { item: NightItem; minute: number; damage: number }[] = [
  { item: "dominio", minute: 40, damage: 180 },
  { item: "sicurezza", minute: 130, damage: 90 },
  { item: "dati", minute: 215, damage: 120 },
  { item: "copie", minute: 290, damage: 120 },
  { item: "dove", minute: 415, damage: 48 },
  { item: "velocita", minute: 455, damage: 24 },
];

export const minuteOfStep = (step: number) => step * MINUTES_PER_STEP;

export function clockTime(minute: number): string {
  const hour = (23 + Math.floor(minute / 60)) % 24;
  return `${pad2(hour)}:${pad2(minute % 60)}`;
}

type Outage = readonly [start: number, end: number];

export function outages(ready: ReadonlySet<NightItem>, now: number): Outage[] {
  return NIGHT_EVENTS.filter((e) => e.minute <= now && !ready.has(e.item)).map(
    (e) => [e.minute, Math.min(NIGHT_MINUTES, e.minute + e.damage)] as const,
  );
}

// Due tagli sovrapposti fanno un rosso solo: il sito non va giu' due volte.
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

export function hoursOnline(ready: ReadonlySet<NightItem>): number {
  const down = uptimeStrip(outages(ready, NIGHT_MINUTES), NIGHT_MINUTES)
    .filter((p) => p.down)
    .reduce((sum, p) => sum + p.minutes, 0);
  return Math.round(((NIGHT_MINUTES - down) / 60) * 10) / 10;
}
