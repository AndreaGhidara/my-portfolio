"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Icon, type NodeIcon } from "./icons";
import { levelNumber } from "./levels";

/**
 * L'anteprima del livello 2: lo schermo e' caduto e si vede il circuito che
 * c'era dietro. Dura il tempo del passaggio da solo al livello dopo.
 *
 * Nel prototipo i nodi erano posati sopra il disegno in percentuale, e con
 * un banco piu' stretto del disegno scivolavano via dai fili. Qui stanno
 * dentro lo stesso svg, nelle stesse coordinate: restano sui fili a ogni
 * larghezza.
 */

const NODI: Record<NodeIcon, [number, number]> = {
  contatti: [70, 110],
  area: [150, 96],
  catalogo: [230, 110],
  pagamenti: [96, 220],
  prenotazioni: [204, 220],
  gestionale: [150, 318],
};

type Punto = NodeIcon | "ingresso";
const PUNTI: Record<Punto, [number, number]> = { ...NODI, ingresso: [150, 40] };

const FILI: [Punto, Punto][] = [
  ["ingresso", "contatti"],
  ["ingresso", "area"],
  ["ingresso", "catalogo"],
  ["catalogo", "pagamenti"],
  ["area", "prenotazioni"],
  ["contatti", "gestionale"],
  ["pagamenti", "gestionale"],
  ["prenotazioni", "gestionale"],
];

const filo = ([a, b]: [Punto, Punto]) => {
  const [x1, y1] = PUNTI[a];
  const [x2, y2] = PUNTI[b];
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
};

/** Le scintille che corrono sui fili: tre colori a giro. */
const SCINTILLE = ["var(--bulb)", "var(--orange)", "var(--screen-light-green)"];

/** Il lato della tessera di un nodo, in unita' del disegno. */
const LATO = 28;

export function ScreenBack({ onRestart: onRicomincia }: { onRestart: () => void }) {
  const t = useTranslations("services.gioco.schermo.dietro");
  const comune = useTranslations("services.gioco.comune");
  // useId porta caratteri che in url(#...) e in href non tutti digeriscono.
  const id = `schermo-${useId().replace(/[^\w-]/g, "")}`;
  const reticolo = `${id}-reticolo`;

  return (
    <>
      <svg className="circuit" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={reticolo} width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M15 0V15M0 15H15" strokeWidth="1" style={{ stroke: "var(--game-grid)" }} />
          </pattern>
        </defs>
        <rect width="300" height="400" style={{ fill: "var(--game-dark)" }} />
        <rect width="300" height="400" fill={`url(#${reticolo})`} />
        {/* Il bordo dello schermo visto da dietro. */}
        <rect
          x="10"
          y="10"
          width="280"
          height="380"
          rx="10"
          fill="none"
          strokeWidth="2"
          strokeDasharray="6 4"
          style={{ stroke: "var(--screen-border-back)" }}
        />
        {/* L'ingresso: il visitatore che tocca lo schermo. */}
        <circle cx="150" cy="40" r="11" strokeWidth="1.5" style={{ fill: "var(--orange)", stroke: "var(--paper)" }} />
        <path d="M146 36 l7 4 l-7 4z" style={{ fill: "var(--paper)" }} />
        <text x="150" y="62" textAnchor="middle" fontSize="6.5" className="lettering">
          {t("ingresso")}
        </text>
        {FILI.map((f, i) => (
          <path
            key={`filo-${i}`}
            id={`${id}-filo${i}`}
            d={filo(f)}
            fill="none"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            style={{ stroke: "var(--muted)" }}
          />
        ))}
        <g className="sparks">
          {FILI.map((_, i) => (
            <circle key={`scintilla-${i}`} r="3" style={{ fill: SCINTILLE[i % 3] }}>
              <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.35}s`}>
                <mpath href={`#${id}-filo${i}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
        {Object.entries(NODI).map(([nome, [x, y]]) => (
          <g key={nome} className="node">
            <rect x={x - LATO / 2} y={y - LATO / 2} width={LATO} height={LATO} rx="5" />
            <svg x={x - LATO / 2 + 3} y={y - LATO / 2 + 3} width={LATO - 6} height={LATO - 6}>
              <Icon name={nome as NodeIcon} />
            </svg>
          </g>
        ))}
        <text x="150" y="372" textAnchor="middle" fontSize="6.5" className="lettering">
          {t("regola")}
        </text>
      </svg>

      <div className="head">
        <span className="level">{comune("etichetta", { numero: levelNumber("logiche"), nome: t("testa") })}</span>
      </div>

      <div className="caption">
        <p className="mono">{t("occhiello")}</p>
        <p>{t("testo")}</p>
        <button type="button" onClick={onRicomincia}>
          {t("ricomincia")}
        </button>
      </div>
    </>
  );
}
