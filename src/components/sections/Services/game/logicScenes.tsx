import type { CSSProperties } from "react";

// Solo disegno: lo stato e i testi arrivano da Logic.tsx.

export type NodeState = { ok?: boolean; broken?: boolean; choice?: number; day?: number };

export type SceneCopy = {
  email: string;
  dentro: string;
  torte: { nome: string; prezzo: string }[];
  finita: string;
  giorni: string[];
  pieno: string;
  importo: string;
  carta: string;
  pagato: string;
  mailA: string;
  mailDa: string;
  mailTitolo: string;
  mailTesto: string;
  registro: string[][];
  nuovo: string[];
};

// Percentuale gia' prenotata per giorno, da lunedi' a domenica.
const BOOKED = [20, 35, 40, 30, 60, 85, 100];

// La torta finita e il giorno pieno: toccarli e' rompere.
export const CAKE_DONE = 2;
export const FULL_DAY = 6;

type Props = {
  node: number;
  state: NodeState;
  copy: SceneCopy;
  onCake: (i: number) => void;
  onDay: (i: number) => void;
};

export function LogicScene({ node, state, copy, onCake, onDay }: Props) {
  switch (node) {
    case 0:
      return (
        <div className="scene">
          <div className={`field${state.ok ? " correct" : ""}`}>
            <span aria-hidden="true">✉</span> {copy.email}
          </div>
          <div className={`field${state.ok ? " correct" : ""}`}>
            <span aria-hidden="true">🔒</span> ••••••••
            {state.ok && <small>{copy.dentro} ✓</small>}
          </div>
        </div>
      );
    case 1:
      return (
        <div className="scene cakes">
          {copy.torte.map((cake, i) => (
            <button
              key={cake.nome}
              type="button"
              className={`cake${state.choice === i ? " choice" : ""}${i === CAKE_DONE ? " finished" : ""}`}
              aria-pressed={state.choice === i}
              onClick={() => onCake(i)}
            >
              <span className="disk" aria-hidden="true" />
              {cake.nome}
              <small>{cake.prezzo}</small>
              {i === CAKE_DONE && <em className="stamp">{copy.finita}</em>}
            </button>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="scene days">
          {copy.giorni.map((g, i) => {
            const p = BOOKED[i];
            return (
              <button
                // Le iniziali si ripetono (M, M): la chiave e' la posizione.
                key={i}
                type="button"
                className={`day${p === 100 ? " full" : ""}${state.day === i ? " chosen" : ""}`}
                aria-pressed={state.day === i}
                style={{ "--full": `${p}%` } as CSSProperties}
                onClick={() => onDay(i)}
              >
                {g}
                <small>{p === 100 ? copy.pieno : `${100 - p}%`}</small>
                <span className="bar" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      );
    case 3:
      return (
        <div className="scene paper">
          <span className="imp">{copy.importo}</span>
          <span className="num">{copy.carta}</span>
          {state.ok && <span className="state">{copy.pagato}</span>}
        </div>
      );
    case 4:
      return (
        <div className="scene mail">
          <div className="intest">
            {copy.mailA} <b>{copy.email}</b> · {copy.mailDa}
          </div>
          <p>
            <b>{copy.mailTitolo}</b> {copy.mailTesto}
          </p>
        </div>
      );
    default:
      return (
        <div className="scene register">
          {[...copy.registro, ...(state.ok ? [copy.nuovo] : [])].map((row, i) => (
            <div key={row[0]} className={i === copy.registro.length ? "new" : undefined}>
              {row.map((cell, j) => (
                <span key={j}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      );
  }
}
