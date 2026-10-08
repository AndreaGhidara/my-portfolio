"use client";

import { useEffect, useState } from "react";
import { CARTIGLIO, CORNICE, DIVISORIO, FORME, RITARDI, richiamo } from "./receipt";

/** Il ritardo scritto come lo scrivono server e client: due decimali, sempre uguali. */
const ritardo = (secondi: number) => ({ transitionDelay: `${secondi.toFixed(2)}s` });

/**
 * La tavola da progetto: il disegno del servizio al centro, i pezzi annotati
 * attorno con le linee di richiamo, la cornice e il cartiglio. Si traccia riga
 * per riga, poi partono i richiami e compaiono le scritte: tutto con
 * transizioni CSS che scattano su `data-traccia`.
 *
 * `anima` falso (il server, e il livello "none") vuol dire gia' tracciata dal
 * primo fotogramma. Vero: la tavola nasce vuota e si accende due fotogrammi
 * dopo, perche' il browser dipinga prima lo stato di partenza e la
 * transizione abbia da dove partire. Ogni stampa nuova la rimonta (la chiave
 * sta nel genitore), e quindi la ritraccia. `aspetta`: bianca e ferma, finche'
 * la stampa non la rimonta.
 *
 * Per chi non vede e' un'immagine sola con il suo nome: dentro, le scritte
 * ripeterebbero lo scontrino un pezzo alla volta.
 */
export function ScontrinoSchema({
  forma,
  titolo,
  pezzi,
  etichetta,
  numero,
  anima,
  aspetta = false,
  tavola,
  scala,
  firma,
}: {
  /** L'id del servizio: sceglie il disegno in FORME. */
  forma: string;
  titolo: string;
  pezzi: string[];
  /** Il nome accessibile della tavola. */
  etichetta: string;
  /** «01», gia' composto. */
  numero: string;
  anima: boolean;
  aspetta?: boolean;
  tavola: string;
  scala: string;
  firma: string;
}) {
  const [traccia, setTraccia] = useState(!anima && !aspetta);

  useEffect(() => {
    if (traccia || aspetta) return;
    let secondo = 0;
    const primo = requestAnimationFrame(() => {
      secondo = requestAnimationFrame(() => setTraccia(true));
    });
    return () => {
      cancelAnimationFrame(primo);
      cancelAnimationFrame(secondo);
    };
  }, [traccia, aspetta]);

  return (
    <div data-scontrino-tavola role="img" aria-label={etichetta}>
      <svg
        viewBox="0 0 600 460"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        data-traccia={traccia ? "" : undefined}
      >
        <path data-tratto="fioco" pathLength={1} d={CORNICE} />
        <path data-tratto="fioco" pathLength={1} d={CARTIGLIO} />
        <path data-tratto="fioco" data-divisorio pathLength={1} d={DIVISORIO} />

        {(FORME[forma] ?? []).map((d, k) => (
          <path
            key={k}
            data-tratto={k === 0 ? "pieno" : "fioco"}
            pathLength={1}
            d={d}
            style={ritardo(RITARDI.riga(k))}
          />
        ))}

        {pezzi.map((pezzo, k) => {
          const r = richiamo(k);
          return (
            <g key={k}>
              <path data-richiamo pathLength={1} d={r.d} style={ritardo(r.ritardo)} />
              <circle data-punto cx={r.punto[0]} cy={r.punto[1]} r={3} style={ritardo(r.ritardo)} />
              <text data-nota x={r.x} y={r.y} textAnchor={r.ancora} style={ritardo(r.ritardoTesto)}>
                {`${k + 1} · ${pezzo.toUpperCase()}`}
              </text>
            </g>
          );
        })}

        <text data-cartiglio="piccolo" x={298} y={404}>
          {`${tavola} ${numero}`}
        </text>
        <text data-cartiglio="titolo" x={298} y={428}>
          {titolo}
        </text>
        <text data-cartiglio="piccolo" data-divisorio x={508} y={408}>
          {scala}
        </text>
        <text data-cartiglio="piccolo" data-divisorio x={508} y={424}>
          {firma}
        </text>
      </svg>
    </div>
  );
}

/**
 * La stessa tavola stampata sullo scontrino, sul telefono: il disegno e i
 * richiami con i soli numeri, a inchiostro sulla carta. Niente cornice ne'
 * cartiglio (il titolo e' gia' stampato sopra), e il viewBox taglia via il
 * bianco attorno, perche' la carta e' stretta.
 *
 * Non si traccia: esce intera, e la scopre la carta che esce dalla fessura.
 * Sta nel corpo dello scontrino, che non si legge: il contenuto e' la lista.
 */
export function ScontrinoFigura({ forma, quanti }: { forma: string; quanti: number }) {
  return (
    <svg viewBox="124 60 352 304" aria-hidden="true" focusable="false">
      {(FORME[forma] ?? []).map((d, k) => (
        <path key={k} data-tratto={k === 0 ? "pieno" : "fioco"} d={d} />
      ))}
      {Array.from({ length: quanti }, (_, k) => {
        const r = richiamo(k);
        return (
          <g key={k}>
            <path data-richiamo d={r.d} />
            <circle data-punto cx={r.punto[0]} cy={r.punto[1]} r={4} />
            <text x={r.x} y={r.y + 7} textAnchor={r.ancora}>
              {k + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
