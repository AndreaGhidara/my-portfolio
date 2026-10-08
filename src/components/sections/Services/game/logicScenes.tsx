import type { CSSProperties } from "react";

/**
 * Le sei scene del livello 2: quello che si vede nel palco a ogni nodo,
 * finche' non lo copre l'incidente. Sono solo disegno: lo stato e i testi
 * arrivano da Logiche.tsx.
 */

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

/** Quanto e' gia' prenotato ogni giorno, da lunedi' a domenica. */
const PIENO = [20, 35, 40, 30, 60, 85, 100];

/** La torta che non c'e' piu' e il giorno tutto pieno: toccarli e' rompere. */
export const CAKE_DONE = 2;
export const FULL_DAY = 6;

type Props = {
  node: number;
  state: NodeState;
  copy: SceneCopy;
  onCake: (i: number) => void;
  onDay: (i: number) => void;
};

export function LogicScene({ node: nodo, state: stato, copy: testi, onCake: onTorta, onDay: onGiorno }: Props) {
  switch (nodo) {
    case 0:
      return (
        <div className="scene">
          <div className={`field${stato.ok ? " correct" : ""}`}>
            <span aria-hidden="true">✉</span> {testi.email}
          </div>
          <div className={`field${stato.ok ? " correct" : ""}`}>
            <span aria-hidden="true">🔒</span> ••••••••
            {stato.ok && <small>{testi.dentro} ✓</small>}
          </div>
        </div>
      );
    case 1:
      return (
        <div className="scene cakes">
          {testi.torte.map((torta, i) => (
            <button
              key={torta.nome}
              type="button"
              className={`cake${stato.choice === i ? " choice" : ""}${i === CAKE_DONE ? " finished" : ""}`}
              aria-pressed={stato.choice === i}
              onClick={() => onTorta(i)}
            >
              <span className="disk" aria-hidden="true" />
              {torta.nome}
              <small>{torta.prezzo}</small>
              {i === CAKE_DONE && <em className="stamp">{testi.finita}</em>}
            </button>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="scene days">
          {testi.giorni.map((g, i) => {
            const p = PIENO[i];
            return (
              <button
                // Le iniziali si ripetono (M, M): la chiave e' la posizione.
                key={i}
                type="button"
                className={`day${p === 100 ? " full" : ""}${stato.day === i ? " chosen" : ""}`}
                aria-pressed={stato.day === i}
                style={{ "--full": `${p}%` } as CSSProperties}
                onClick={() => onGiorno(i)}
              >
                {g}
                <small>{p === 100 ? testi.pieno : `${100 - p}%`}</small>
                <span className="bar" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      );
    case 3:
      return (
        <div className="scene paper">
          <span className="imp">{testi.importo}</span>
          <span className="num">{testi.carta}</span>
          {stato.ok && <span className="state">{testi.pagato}</span>}
        </div>
      );
    case 4:
      return (
        <div className="scene mail">
          <div className="intest">
            {testi.mailA} <b>{testi.email}</b> · {testi.mailDa}
          </div>
          <p>
            <b>{testi.mailTitolo}</b> {testi.mailTesto}
          </p>
        </div>
      );
    default:
      return (
        <div className="scene register">
          {[...testi.registro, ...(stato.ok ? [testi.nuovo] : [])].map((riga, i) => (
            <div key={riga[0]} className={i === testi.registro.length ? "new" : undefined}>
              {riga.map((cella, j) => (
                <span key={j}>{cella}</span>
              ))}
            </div>
          ))}
        </div>
      );
  }
}
