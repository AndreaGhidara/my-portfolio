"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { MotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { ZONES, type Garment, type ZoneId } from "@/content/toolbox";
import { NodeLabel } from "./NodeLabel";
import {
  NODES,
  nodeHeight,
  toolById,
  seam,
  curve,
  nodeWidth,
  parentOf,
  pathTo,
  garmentStops,
  neighbours,
} from "./graph";
import { THREADS, restPositions, type Thread } from "./motion";
import type { ToolboxStep, ToolboxCopy } from "./types";
import { useNeedle } from "./useNeedle";
import { ENTRANCE, useEntrance } from "./useEntrance";
import { useDrag } from "./useDrag";

const LARGO = 1200;
const ALTO = 820;

/**
 * La mappa della cassetta: nove pezze di stoffa, gli attrezzi cuciti sopra
 * come etichette, i fili fra chi lavora con chi, e a destra l'etichetta di
 * quello che si e' aperto.
 *
 * Il server la rende gia' finita, nella sua scatola con le proporzioni del
 * banco: niente misure nel browser, niente scambio di vista dopo il montaggio,
 * e la sezione ha la stessa altezza prima e dopo il JavaScript.
 *
 * Tutto il movimento e' a "full": l'entrata dei nodi, il trascinamento con la
 * molla e l'ago che cuce. A "reduced" e a "none" la mappa sta ferma e il filo
 * di un capo e' gia' cucito. Il passaggio del mouse che accende la strada
 * fino al cartellino non e' movimento, e vale sempre.
 *
 * La mappa e' fuori dall'ordine di tabulazione e nascosta agli screen reader:
 * il percorso da tastiera sono i bottoni «cuci per» e l'etichetta qui accanto,
 * che da ogni nodo porta ai suoi vicini; chi legge ha l'elenco per scomparti.
 */
export function ToolboxMap({
  copy: testi,
  garment: capo,
  step: passo,
  onNode: onNodo,
  onGarment: onCapo,
  actions: azioni,
  level,
  active: attiva,
}: {
  copy: ToolboxCopy;
  garment: Garment | null;
  step: ToolboxStep;
  onNode: (id: string) => void;
  onGarment: (id: string) => void;
  actions: ReactNode;
  level: MotionLevel;
  /** Se e' la vista che il CSS mostra adesso: l'altra non si anima. */
  active: boolean;
}) {
  const banco = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const [acceso, setAcceso] = useState<string | null>(null);
  const idMaschera = useId().replace(/:/g, "");

  const percorso = useMemo(() => (capo ? garmentStops(capo) : []), [capo]);
  const disegnoCucitura = useMemo(
    () => seam(percorso.map((id) => restPositions.get(id)!)),
    [percorso],
  );

  // GSAP arriva dopo la prima pittura: la mappa lo tiene a portata di mano
  // per la molla e per l'ago, che partono da un clic e non da una build.
  useSectionAnimation(({ gsap }) => {
    gsapRef.current = gsap;
    return () => {
      gsapRef.current = null;
    };
  }, banco);

  const pieno = level === "full" && attiva;

  const entrata = useEntrance(banco, pieno);
  const { cucituraRef, mascheraRef, agoRef, cuciti } = useNeedle({
    garment: capo,
    full: pieno,
    seam: disegnoCucitura,
    stops: percorso.length,
    svg,
    gsapRef,
  });
  const { gruppi, tracciati, presa, giu, muovi, su, annulla } =
    useDrag({
      svg,
      gsapRef,
      full: pieno,
      onTap: (id) => {
        onNodo(id);
        if (!capo) setAcceso(id);
      },
    });

  /* La strada fino al cartellino, e i vicini: solo senza un capo scelto,
     perche' con un capo la mappa racconta gia' un'altra cosa. */
  const luce = !capo && acceso ? acceso : null;
  const stradaAccesa = luce ? pathTo(luce) : [];
  const nodiAccesi = new Set(luce ? [...stradaAccesa, ...neighbours(luce)] : []);
  const filoAcceso = (f: Thread) =>
    !!luce &&
    (f.a === luce ||
      f.b === luce ||
      (stradaAccesa.includes(f.a) &&
        stradaAccesa.includes(f.b) &&
        (parentOf(f.b) === f.a || parentOf(f.a) === f.b)));

  const tappaDi = new Map(percorso.map((id, i) => [id, i]));
  const zoneUsate = new Set(
    capo ? capo.uses.map((id) => toolById(id)!.zone) : [],
  );
  const scelto = passo.kind === "nodo" ? passo.id : null;

  return (
    <div data-toolbox-map>
      <div ref={banco} data-toolbox-bench>
        <svg
          ref={svg}
          viewBox={`0 0 ${LARGO} ${ALTO}`}
          aria-hidden="true"
          focusable="false"
          data-state={capo ? "chosen" : luce ? "off" : undefined}
          data-entrance={entrata ?? undefined}
        >
          <defs>
            <pattern
              id={`${idMaschera}-righe`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path d="M0 0 V8" data-texture />
            </pattern>
            <pattern
              id={`${idMaschera}-punti`}
              width="9"
              height="9"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4.5" cy="4.5" r="0.9" data-texture-point />
            </pattern>
            <pattern
              id={`${idMaschera}-quadretti`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0 H12 M0 0 V12" data-texture />
            </pattern>
            <mask
              id={`${idMaschera}-cucito`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={LARGO}
              height={ALTO}
            >
              <path
                ref={mascheraRef}
                d={disegnoCucitura.d}
                fill="none"
                stroke="white"
                strokeWidth="8"
              />
            </mask>
          </defs>

          <g>
            {ZONES.map((z) => {
              const [x, y, w, h] = z.r;
              return (
                <g
                  key={z.id}
                  data-patch
                  data-zone={z.id}
                  data-used={zoneUsate.has(z.id) || undefined}
                >
                  <rect x={x} y={y} width={w} height={h} rx="10" data-fabric />
                  {TRAMA[z.id] && (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx="10"
                      data-texture-bg
                      fill={`url(#${idMaschera}-${TRAMA[z.id]})`}
                    />
                  )}
                  <rect
                    x={x + 6}
                    y={y + 6}
                    width={w - 12}
                    height={h - 12}
                    rx="7"
                    data-hem
                  />
                  <text
                    x={x + w - 14}
                    y={y + h - 13}
                    textAnchor="end"
                    data-count
                  >
                    {testi.zones[z.id].count}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {THREADS.map((f, i) => (
              <path
                key={`${f.a}-${f.b}`}
                ref={(el) => {
                  tracciati.current[i] = el;
                }}
                d={curve(restPositions.get(f.a)!, restPositions.get(f.b)!)}
                data-thread={f.crossing ? "crossing" : "branch"}
                data-lit={filoAcceso(f) || undefined}
              />
            ))}
          </g>

          {capo && (
            <path
              ref={cucituraRef}
              d={disegnoCucitura.d}
              data-seam
              mask={`url(#${idMaschera}-cucito)`}
            />
          )}

          <g>
            {NODES.map((n) => {
              const testo =
                n.kind === "root"
                  ? testi.root.name
                  : n.kind === "junction"
                    ? testi.zones[n.zone!].junction
                    : toolById(n.id)!.name;
              const w = nodeWidth(n.kind, testo);
              const h = nodeHeight(n.kind);
              const genitore = restPositions.get(parentOf(n.id) ?? n.id)!;
              const passo = tappaDi.get(n.id);
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) gruppi.current.set(n.id, el);
                    else gruppi.current.delete(n.id);
                  }}
                  transform={`translate(${n.x} ${n.y})`}
                  data-node={n.kind}
                  data-zone={n.zone ?? undefined}
                  data-lit={nodiAccesi.has(n.id) || undefined}
                  data-chosen={(!capo && scelto === n.id) || undefined}
                  data-sewn={
                    (passo !== undefined && passo < cuciti) || undefined
                  }
                  onPointerEnter={() => {
                    if (!presa.current) setAcceso(n.id);
                  }}
                  onPointerLeave={() => {
                    if (!presa.current) setAcceso(null);
                  }}
                  onPointerDown={giu(n.id)}
                  onPointerMove={muovi}
                  onPointerUp={su}
                  onPointerCancel={annulla}
                >
                  <g
                    data-body
                    style={
                      {
                        "--dx": `${genitore.x - n.x}px`,
                        "--dy": `${genitore.y - n.y}px`,
                        "--i": ENTRANCE.get(n.id) ?? 0,
                      } as React.CSSProperties
                    }
                  >
                    <rect
                      x={-w / 2}
                      y={-h / 2}
                      width={w}
                      height={h}
                      rx={n.kind === "junction" ? 13 : 3}
                      data-backdrop
                    />
                    <rect
                      x={-w / 2 + 3}
                      y={-h / 2 + 3}
                      width={w - 6}
                      height={h - 6}
                      rx={n.kind === "junction" ? 10 : 2}
                      data-points
                    />
                    <text y={n.kind === "root" ? 5 : 4} textAnchor="middle">
                      {testo}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          <g ref={agoRef} data-needle style={{ opacity: 0 }}>
            <path d="M-2 -22 L2 -22 L1.2 14 L0 20 L-1.2 14 Z" />
            <ellipse cx="0" cy="-16" rx="0.9" ry="3" />
          </g>
        </svg>
      </div>

      <div data-toolbox-column>
        <aside
          data-toolbox-panel
          aria-live="polite"
          aria-label={testi.label.name}
        >
          <NodeLabel
            key={`${passo.kind}-${passo.id}`}
            step={passo}
            copy={testi}
            onNode={onNodo}
            onGarment={onCapo}
            actions={azioni}
          />
        </aside>
      </div>
    </div>
  );
}

/** La trama di ogni pezza: pieni e vuoti, righe, punti, quadretti. Il colore lo decide il CSS. */
const TRAMA: Record<ZoneId, "righe" | "punti" | "quadretti" | null> = {
  front: null,
  stili: "punti",
  mezzo: null,
  back: null,
  auth: "righe",
  dati: "righe",
  casa: "quadretti",
  ovunque: null,
  ai: "quadretti",
};
