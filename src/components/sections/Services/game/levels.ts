// Fuori da Game.tsx perche' lo importano anche i livelli: un livello che
// importa a runtime dal guscio che lo monta farebbe un giro chiuso.
export const LEVELS = ["schermo", "logiche", "pannello", "notte"] as const;

export type LevelId = (typeof LEVELS)[number];

export const levelNumber = (id: LevelId) => LEVELS.indexOf(id) + 1;

// Nel finale `onNext` e' «torna al sito». Con `visible` false i timer del
// livello si fermano, e al ritorno riprendono.
export type LevelProps = { onNext: () => void; visible: boolean };
