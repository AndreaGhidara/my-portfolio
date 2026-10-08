/**
 * I quattro livelli, nell'ordine in cui si giocano, e il contratto che ognuno
 * rispetta. Sta in un modulo suo e non in Game.tsx perche' lo leggono anche
 * i livelli (il finale elenca gli strati in quest'ordine), e un livello che
 * importa a runtime dal guscio che lo monta sarebbe un giro chiuso. Game.tsx
 * lo riesporta: e' li' che si va a cercarlo.
 */
export const LEVELS = ["schermo", "logiche", "pannello", "notte"] as const;

export type LevelId = (typeof LEVELS)[number];

/** Il numero che il giocatore legge: il primo livello e' l'1. */
export const levelNumber = (id: LevelId) => LEVELS.indexOf(id) + 1;

/**
 * Le props di ogni livello, finale compreso.
 *
 * - `onNext`: il livello ha finito e si passa al prossimo. Lo chiama il
 *   pulsante che porta avanti (al livello 1 il passaggio da solo dopo la
 *   caduta dello schermo). Nel finale e' «torna al sito», il giro da capo.
 * - `visible`: il gioco e' sullo schermo. Quando e' false i timer del
 *   livello si fermano; quando torna true riprendono (vedi useVisible).
 */
export type LevelProps = { onNext: () => void; visible: boolean };
