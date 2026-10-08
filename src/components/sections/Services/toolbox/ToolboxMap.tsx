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

const WIDTH = 1200;
const HEIGHT = 820;

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
  copy,
  garment,
  step,
  onNode,
  onGarment,
  actions,
  level,
  active,
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
  const bench = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const idPrefix = useId().replace(/:/g, "");

  const stops = useMemo(() => (garment ? garmentStops(garment) : []), [garment]);
  const seamPath = useMemo(
    () => seam(stops.map((id) => restPositions.get(id)!)),
    [stops],
  );

  // GSAP arriva dopo la prima pittura: la mappa lo tiene a portata di mano
  // per la molla e per l'ago, che partono da un clic e non da una build.
  useSectionAnimation(({ gsap }) => {
    gsapRef.current = gsap;
    return () => {
      gsapRef.current = null;
    };
  }, bench);

  const full = level === "full" && active;

  const entrance = useEntrance(bench, full);
  const { seamRef, maskRef, needleRef, sewn } = useNeedle({
    garment,
    full,
    seam: seamPath,
    stops: stops.length,
    svg,
    gsapRef,
  });
  const { groups, paths, grab, pointerDown, pointerMove, pointerUp, pointerCancel } =
    useDrag({
      svg,
      gsapRef,
      full,
      onTap: (id) => {
        onNode(id);
        if (!garment) setHovered(id);
      },
    });

  /* La strada fino al cartellino, e i vicini: solo senza un capo scelto,
     perche' con un capo la mappa racconta gia' un'altra cosa. */
  const lit = !garment && hovered ? hovered : null;
  const litPath = lit ? pathTo(lit) : [];
  const litNodes = new Set(lit ? [...litPath, ...neighbours(lit)] : []);
  const isThreadLit = (f: Thread) =>
    !!lit &&
    (f.a === lit ||
      f.b === lit ||
      (litPath.includes(f.a) &&
        litPath.includes(f.b) &&
        (parentOf(f.b) === f.a || parentOf(f.a) === f.b)));

  const stopIndex = new Map(stops.map((id, i) => [id, i]));
  const usedZones = new Set(
    garment ? garment.uses.map((id) => toolById(id)!.zone) : [],
  );
  const chosen = step.kind === "node" ? step.id : null;

  return (
    <div data-toolbox-map>
      <div ref={bench} data-toolbox-bench>
        <svg
          ref={svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          aria-hidden="true"
          focusable="false"
          data-state={garment ? "chosen" : lit ? "off" : undefined}
          data-entrance={entrance ?? undefined}
        >
          <defs>
            <pattern
              id={`${idPrefix}-lines`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path d="M0 0 V8" data-texture />
            </pattern>
            <pattern
              id={`${idPrefix}-dots`}
              width="9"
              height="9"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4.5" cy="4.5" r="0.9" data-texture-point />
            </pattern>
            <pattern
              id={`${idPrefix}-grid`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0 H12 M0 0 V12" data-texture />
            </pattern>
            <mask
              id={`${idPrefix}-sewn`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={WIDTH}
              height={HEIGHT}
            >
              <path
                ref={maskRef}
                d={seamPath.d}
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
                  data-used={usedZones.has(z.id) || undefined}
                >
                  <rect x={x} y={y} width={w} height={h} rx="10" data-fabric />
                  {TEXTURE[z.id] && (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx="10"
                      data-texture-bg
                      fill={`url(#${idPrefix}-${TEXTURE[z.id]})`}
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
                    {copy.zones[z.id].count}
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
                  paths.current[i] = el;
                }}
                d={curve(restPositions.get(f.a)!, restPositions.get(f.b)!)}
                data-thread={f.crossing ? "crossing" : "branch"}
                data-lit={isThreadLit(f) || undefined}
              />
            ))}
          </g>

          {garment && (
            <path
              ref={seamRef}
              d={seamPath.d}
              data-seam
              mask={`url(#${idPrefix}-sewn)`}
            />
          )}

          <g>
            {NODES.map((n) => {
              const text =
                n.kind === "root"
                  ? copy.root.name
                  : n.kind === "junction"
                    ? copy.zones[n.zone!].junction
                    : toolById(n.id)!.name;
              const w = nodeWidth(n.kind, text);
              const h = nodeHeight(n.kind);
              const parent = restPositions.get(parentOf(n.id) ?? n.id)!;
              const stop = stopIndex.get(n.id);
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) groups.current.set(n.id, el);
                    else groups.current.delete(n.id);
                  }}
                  transform={`translate(${n.x} ${n.y})`}
                  data-node={n.kind}
                  data-zone={n.zone ?? undefined}
                  data-lit={litNodes.has(n.id) || undefined}
                  data-chosen={(!garment && chosen === n.id) || undefined}
                  data-sewn={
                    (stop !== undefined && stop < sewn) || undefined
                  }
                  onPointerEnter={() => {
                    if (!grab.current) setHovered(n.id);
                  }}
                  onPointerLeave={() => {
                    if (!grab.current) setHovered(null);
                  }}
                  onPointerDown={pointerDown(n.id)}
                  onPointerMove={pointerMove}
                  onPointerUp={pointerUp}
                  onPointerCancel={pointerCancel}
                >
                  <g
                    data-body
                    style={
                      {
                        "--dx": `${parent.x - n.x}px`,
                        "--dy": `${parent.y - n.y}px`,
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
                      {text}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          <g ref={needleRef} data-needle style={{ opacity: 0 }}>
            <path d="M-2 -22 L2 -22 L1.2 14 L0 20 L-1.2 14 Z" />
            <ellipse cx="0" cy="-16" rx="0.9" ry="3" />
          </g>
        </svg>
      </div>

      <div data-toolbox-column>
        <aside
          data-toolbox-panel
          aria-live="polite"
          aria-label={copy.label.name}
        >
          <NodeLabel
            key={`${step.kind}-${step.id}`}
            step={step}
            copy={copy}
            onNode={onNode}
            onGarment={onGarment}
            actions={actions}
          />
        </aside>
      </div>
    </div>
  );
}

/** La trama di ogni pezza: pieni e vuoti, righe, punti, quadretti. Il colore lo decide il CSS. */
const TEXTURE: Record<ZoneId, "lines" | "dots" | "grid" | null> = {
  front: null,
  stili: "dots",
  mezzo: null,
  back: null,
  auth: "lines",
  dati: "lines",
  casa: "grid",
  ovunque: null,
  ai: "grid",
};
