import { useEffect, useRef, type RefObject } from "react";
import { curva } from "./grafo";
import { FILI, inMappa, oltreSoglia, riposo, type Punto } from "./movimento";

type Gsap = typeof import("gsap").gsap;

/**
 * Il trascinamento: a "full" un'etichetta si prende e si sposta, e al
 * rilascio torna al suo posto con una molla di GSAP. Niente ciclo sempre
 * acceso: si lavora solo mentre qualcosa si muove, e si riscrivono solo i
 * fili del nodo preso. Sotto la soglia il gesto e' un clic, e va a onClic.
 *
 * Restituisce i ref da appendere a nodi e fili, i gestori del puntatore e la
 * presa in corso, che il passaggio del mouse deve rispettare.
 */
export function useTrascinamento({
  svg,
  gsapRef,
  pieno,
  onClic,
}: {
  svg: RefObject<SVGSVGElement | null>;
  gsapRef: RefObject<Gsap | null>;
  pieno: boolean;
  onClic: (id: string) => void;
}) {
  const gruppi = useRef(new Map<string, SVGGElement>());
  const tracciati = useRef<(SVGPathElement | null)[]>([]);
  const posizioni = useRef(
    new Map<string, Punto>([...riposo].map(([id, p]) => [id, { ...p }])),
  );
  const presa = useRef<{
    id: string;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
    mosso: boolean;
  } | null>(null);

  /** Riscrive solo i fili del nodo che si muove, non tutti e ottanta. */
  const ridisegna = (id: string) => {
    const pos = posizioni.current;
    FILI.forEach((f, i) => {
      if (f.a !== id && f.b !== id) return;
      tracciati.current[i]?.setAttribute(
        "d",
        curva(pos.get(f.a)!, pos.get(f.b)!),
      );
    });
    const p = pos.get(id)!;
    gruppi.current
      .get(id)
      ?.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`,
      );
  };

  const versoMappa = (x: number, y: number): Punto => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x, y };
    return inMappa(m.inverse(), x, y);
  };

  const giu = (id: string) => (e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    const p = posizioni.current.get(id)!;
    const q = versoMappa(e.clientX, e.clientY);
    presa.current = {
      id,
      x0: e.clientX,
      y0: e.clientY,
      dx: p.x - q.x,
      dy: p.y - q.y,
      mosso: false,
    };
    gsapRef.current?.killTweensOf(p);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const muovi = (e: React.PointerEvent<SVGGElement>) => {
    const pr = presa.current;
    if (!pr || !pieno || !gsapRef.current) return;
    if (
      !pr.mosso &&
      !oltreSoglia({ x: pr.x0, y: pr.y0 }, { x: e.clientX, y: e.clientY })
    )
      return;
    pr.mosso = true;
    const q = versoMappa(e.clientX, e.clientY);
    const p = posizioni.current.get(pr.id)!;
    p.x = q.x + pr.dx;
    p.y = q.y + pr.dy;
    ridisegna(pr.id);
  };

  // Le molle nascono da un gesto, fuori dal contesto di useSectionAnimation:
  // nessuno le spegnerebbe allo smontaggio.
  const molle = useRef(new Set<gsap.core.Tween>());
  useEffect(() => {
    const vive = molle.current;
    return () => {
      for (const t of vive) t.kill();
      vive.clear();
    };
  }, []);

  const molla = (id: string) => {
    const gsap = gsapRef.current;
    const p = posizioni.current.get(id)!;
    const r = riposo.get(id)!;
    if (!gsap) {
      p.x = r.x;
      p.y = r.y;
      ridisegna(id);
      return;
    }
    const tween = gsap.to(p, {
      x: r.x,
      y: r.y,
      duration: 1.1,
      ease: "elastic.out(1, 0.45)",
      onUpdate: () => ridisegna(id),
      onComplete: () => {
        molle.current.delete(tween);
      },
    });
    molle.current.add(tween);
  };

  const su = (e: React.PointerEvent<SVGGElement>) => {
    const pr = presa.current;
    presa.current = null;
    if (!pr) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (pr.mosso) {
      molla(pr.id);
      return;
    }
    onClic(pr.id);
  };

  const annulla = () => {
    const pr = presa.current;
    presa.current = null;
    if (pr?.mosso) molla(pr.id);
  };

  // Rimesso tutto al suo posto quando il movimento si spegne a meta' presa.
  useEffect(() => {
    if (pieno) return;
    for (const [id, r] of riposo) {
      const p = posizioni.current.get(id)!;
      if (p.x === r.x && p.y === r.y) continue;
      p.x = r.x;
      p.y = r.y;
      ridisegna(id);
    }
  }, [pieno]);

  return { gruppi, tracciati, presa, giu, muovi, su, annulla };
}
