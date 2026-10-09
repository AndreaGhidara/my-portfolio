"use client";

import { useEffect, useState } from "react";
import { DELAYS, DIVIDER, FIGURE_SHAPES, FRAME, TITLE_BLOCK, callout } from "./receipt";

/** Il ritardo scritto come lo scrivono server e client: due decimali, sempre uguali. */
const delay = (seconds: number) => ({ transitionDelay: `${seconds.toFixed(2)}s` });

// Si traccia con transizioni CSS che scattano su `data-trace`. Con `animate` nasce
// vuota e si accende due fotogrammi dopo, perche' il browser dipinga prima lo stato
// di partenza; ogni stampa la rimonta (la chiave sta nel genitore). Per chi non
// vede e' un'immagine sola: dentro, le scritte ripeterebbero lo scontrino.
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
  /** L'id del servizio: sceglie il disegno in FIGURE_SHAPES. */
  shape: string;
  title: string;
  pieces: string[];
  /** Il nome accessibile della tavola. */
  label: string;
  /** «01», gia' composto. */
  number: string;
  animate: boolean;
  /** Bianca e ferma finche' la stampa non la rimonta. */
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

// Sullo scontrino, sul telefono: richiami coi soli numeri, niente cornice, e il
// viewBox taglia il bianco attorno perche' la carta e' stretta. Non si traccia: la
// scopre la carta che esce dalla fessura.
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
