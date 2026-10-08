"use client";

import { useEffect, useState } from "react";
import { DELAYS, DIVIDER, FIGURE_SHAPES, FRAME, TITLE_BLOCK, callout } from "./receipt";

/** Il ritardo scritto come lo scrivono server e client: due decimali, sempre uguali. */
const delay = (seconds: number) => ({ transitionDelay: `${seconds.toFixed(2)}s` });

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
export function ReceiptSchema({
  shape,
  title,
  pieces,
  label,
  number,
  animate,
  wait = false,
  plate,
  scale,
  signature,
}: {
  /** L'id del servizio: sceglie il disegno in FORME. */
  shape: string;
  title: string;
  pieces: string[];
  /** Il nome accessibile della tavola. */
  label: string;
  /** «01», gia' composto. */
  number: string;
  animate: boolean;
  wait?: boolean;
  plate: string;
  scale: string;
  signature: string;
}) {
  const [traced, setTraced] = useState(!animate && !wait);

  useEffect(() => {
    if (traced || wait) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setTraced(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [traced, wait]);

  return (
    <div data-receipt-plate role="img" aria-label={label}>
      <svg
        viewBox="0 0 600 460"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        data-trace={traced ? "" : undefined}
      >
        <path data-stroke="faint" pathLength={1} d={FRAME} />
        <path data-stroke="faint" pathLength={1} d={TITLE_BLOCK} />
        <path data-stroke="faint" data-divider pathLength={1} d={DIVIDER} />

        {(FIGURE_SHAPES[shape] ?? []).map((d, k) => (
          <path
            key={k}
            data-stroke={k === 0 ? "full" : "faint"}
            pathLength={1}
            d={d}
            style={delay(DELAYS.line(k))}
          />
        ))}

        {pieces.map((piece, k) => {
          const r = callout(k);
          return (
            <g key={k}>
              <path data-callout pathLength={1} d={r.d} style={delay(r.delay)} />
              <circle data-point cx={r.point[0]} cy={r.point[1]} r={3} style={delay(r.delay)} />
              <text data-note x={r.x} y={r.y} textAnchor={r.anchor} style={delay(r.textDelay)}>
                {`${k + 1} · ${piece.toUpperCase()}`}
              </text>
            </g>
          );
        })}

        <text data-title-block="small" x={298} y={404}>
          {`${plate} ${number}`}
        </text>
        <text data-title-block="title" x={298} y={428}>
          {title}
        </text>
        <text data-title-block="small" data-divider x={508} y={408}>
          {scale}
        </text>
        <text data-title-block="small" data-divider x={508} y={424}>
          {signature}
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
export function ReceiptFigure({ shape, count }: { shape: string; count: number }) {
  return (
    <svg viewBox="124 60 352 304" aria-hidden="true" focusable="false">
      {(FIGURE_SHAPES[shape] ?? []).map((d, k) => (
        <path key={k} data-stroke={k === 0 ? "full" : "faint"} d={d} />
      ))}
      {Array.from({ length: count }, (_, k) => {
        const r = callout(k);
        return (
          <g key={k}>
            <path data-callout d={r.d} />
            <circle data-point cx={r.point[0]} cy={r.point[1]} r={4} />
            <text x={r.x} y={r.y + 7} textAnchor={r.anchor}>
              {k + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
