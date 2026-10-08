import type { CSSProperties } from "react";

/**
 * Le sei scene del livello 2: quello che si vede nel palco a ogni nodo,
 * finche' non lo copre l'incidente. Sono solo disegno: lo stato e i testi
 * arrivano da Logiche.tsx.
 */

export type StatoNodo = { ok?: boolean; rotto?: boolean; scelta?: number; giorno?: number };

export type TestiScene = {
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
export const TORTA_FINITA = 2;
export const GIORNO_PIENO = 6;

type Props = {
  nodo: number;
  stato: StatoNodo;
  testi: TestiScene;
  onTorta: (i: number) => void;
  onGiorno: (i: number) => void;
};

export function Scena({ nodo, stato, testi, onTorta, onGiorno }: Props) {
  switch (nodo) {
    case 0:
      return (
        <div className="scena">
          <div className={`campo${stato.ok ? " giusto" : ""}`}>
            <span aria-hidden="true">✉</span> {testi.email}
          </div>
          <div className={`campo${stato.ok ? " giusto" : ""}`}>
            <span aria-hidden="true">🔒</span> ••••••••
            {stato.ok && <small>{testi.dentro} ✓</small>}
          </div>
        </div>
      );
    case 1:
      return (
        <div className="scena torte">
          {testi.torte.map((torta, i) => (
            <button
              key={torta.nome}
              type="button"
              className={`torta${stato.scelta === i ? " scelta" : ""}${i === TORTA_FINITA ? " finita" : ""}`}
              aria-pressed={stato.scelta === i}
              onClick={() => onTorta(i)}
            >
              <span className="disco" aria-hidden="true" />
              {torta.nome}
              <small>{torta.prezzo}</small>
              {i === TORTA_FINITA && <em className="timbro">{testi.finita}</em>}
            </button>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="scena giorni">
          {testi.giorni.map((g, i) => {
            const p = PIENO[i];
            return (
              <button
                // Le iniziali si ripetono (M, M): la chiave e' la posizione.
                key={i}
                type="button"
                className={`giorno${p === 100 ? " pieno" : ""}${stato.giorno === i ? " scelto" : ""}`}
                aria-pressed={stato.giorno === i}
                style={{ "--pieno": `${p}%` } as CSSProperties}
                onClick={() => onGiorno(i)}
              >
                {g}
                <small>{p === 100 ? testi.pieno : `${100 - p}%`}</small>
                <span className="barra" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      );
    case 3:
      return (
        <div className="scena carta">
          <span className="imp">{testi.importo}</span>
          <span className="num">{testi.carta}</span>
          {stato.ok && <span className="stato">{testi.pagato}</span>}
        </div>
      );
    case 4:
      return (
        <div className="scena mail">
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
        <div className="scena registro">
          {[...testi.registro, ...(stato.ok ? [testi.nuovo] : [])].map((riga, i) => (
            <div key={riga[0]} className={i === testi.registro.length ? "nuovo" : undefined}>
              {riga.map((cella, j) => (
                <span key={j}>{cella}</span>
              ))}
            </div>
          ))}
        </div>
      );
  }
}
