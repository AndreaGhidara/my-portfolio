"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Icon, type NodeIcon } from "./icons";
import { levelNumber } from "./levels";

// I nodi stanno nello stesso svg dei fili, nelle stesse coordinate: posati
// sopra in percentuale, su un banco stretto scivolavano via.

const NODES: Record<NodeIcon, [number, number]> = {
  contatti: [70, 110],
  area: [150, 96],
  catalogo: [230, 110],
  pagamenti: [96, 220],
  prenotazioni: [204, 220],
  gestionale: [150, 318],
};

type Point = NodeIcon | "entry";
const POINTS: Record<Point, [number, number]> = { ...NODES, entry: [150, 40] };

const WIRES: [Point, Point][] = [
  ["entry", "contatti"],
  ["entry", "area"],
  ["entry", "catalogo"],
  ["catalogo", "pagamenti"],
  ["area", "prenotazioni"],
  ["contatti", "gestionale"],
  ["pagamenti", "gestionale"],
  ["prenotazioni", "gestionale"],
];

const wirePath = ([a, b]: [Point, Point]) => {
  const [x1, y1] = POINTS[a];
  const [x2, y2] = POINTS[b];
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
};

const SPARKS = ["var(--bulb)", "var(--orange)", "var(--screen-light-green)"];

const SIDE = 28;

export function ScreenBack({ onRestart }: { onRestart: () => void }) {
  const t = useTranslations("services.gioco.schermo.dietro");
  const common = useTranslations("services.gioco.comune");
  // useId porta caratteri che in url(#...) e in href non tutti digeriscono.
  const id = `screen-${useId().replace(/[^\w-]/g, "")}`;
  const grid = `${id}-grid`;

  return (
    <>
      <svg className="circuit" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={grid} width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M15 0V15M0 15H15" strokeWidth="1" style={{ stroke: "var(--game-grid)" }} />
          </pattern>
        </defs>
        <rect width="300" height="400" style={{ fill: "var(--game-dark)" }} />
        <rect width="300" height="400" fill={`url(#${grid})`} />
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
        {WIRES.map((f, i) => (
          <path
            key={`wire-${i}`}
            id={`${id}-wire${i}`}
            d={wirePath(f)}
            fill="none"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            style={{ stroke: "var(--muted)" }}
          />
        ))}
        <g className="sparks">
          {WIRES.map((_, i) => (
            <circle key={`spark-${i}`} r="3" style={{ fill: SPARKS[i % 3] }}>
              <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.35}s`}>
                <mpath href={`#${id}-wire${i}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
        {Object.entries(NODES).map(([name, [x, y]]) => (
          <g key={name} className="node">
            <rect x={x - SIDE / 2} y={y - SIDE / 2} width={SIDE} height={SIDE} rx="5" />
            <svg x={x - SIDE / 2 + 3} y={y - SIDE / 2 + 3} width={SIDE - 6} height={SIDE - 6}>
              <Icon name={name as NodeIcon} />
            </svg>
          </g>
        ))}
        <text x="150" y="372" textAnchor="middle" fontSize="6.5" className="lettering">
          {t("regola")}
        </text>
      </svg>

      <div className="head">
        <span className="level">{common("etichetta", { numero: levelNumber("logiche"), nome: t("testa") })}</span>
      </div>

      <div className="caption">
        <p className="mono">{t("occhiello")}</p>
        <p>{t("testo")}</p>
        <button type="button" onClick={onRestart}>
          {t("ricomincia")}
        </button>
      </div>
    </>
  );
}
