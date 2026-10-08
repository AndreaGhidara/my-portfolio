import { useEffect, useRef, type RefObject } from "react";
import { curve } from "./graph";
import { THREADS, toMapPoint, pastThreshold, restPositions, type MapPoint } from "./motion";

type Gsap = typeof import("gsap").gsap;

// Niente ciclo sempre acceso: si lavora solo mentre qualcosa si muove. Sotto
// la soglia il gesto e' un clic e va a onTap. `grab` e' esposto perche' il
// passaggio del mouse non deve accendere altri nodi durante una presa.
export function useDrag({
  svg,
  gsapRef,
  full,
  onTap,
}: {
  svg: RefObject<SVGSVGElement | null>;
  gsapRef: RefObject<Gsap | null>;
  full: boolean;
  onTap: (id: string) => void;
}) {
  const groups = useRef(new Map<string, SVGGElement>());
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const positions = useRef(
    new Map<string, MapPoint>([...restPositions].map(([id, p]) => [id, { ...p }])),
  );
  const grab = useRef<{
    id: string;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);

  // Solo i fili del nodo che si muove, non tutti e ottanta.
  const redraw = (id: string) => {
    const pos = positions.current;
    THREADS.forEach((f, i) => {
      if (f.a !== id && f.b !== id) return;
      paths.current[i]?.setAttribute(
        "d",
        curve(pos.get(f.a)!, pos.get(f.b)!),
      );
    });
    const p = pos.get(id)!;
    groups.current
      .get(id)
      ?.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`,
      );
  };

  const toMap = (x: number, y: number): MapPoint => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x, y };
    return toMapPoint(m.inverse(), x, y);
  };

  const pointerDown = (id: string) => (e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    const p = positions.current.get(id)!;
    const q = toMap(e.clientX, e.clientY);
    grab.current = {
      id,
      x0: e.clientX,
      y0: e.clientY,
      dx: p.x - q.x,
      dy: p.y - q.y,
      moved: false,
    };
    gsapRef.current?.killTweensOf(p);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const pointerMove = (e: React.PointerEvent<SVGGElement>) => {
    const pr = grab.current;
    if (!pr || !full || !gsapRef.current) return;
    if (
      !pr.moved &&
      !pastThreshold({ x: pr.x0, y: pr.y0 }, { x: e.clientX, y: e.clientY })
    )
      return;
    pr.moved = true;
    const q = toMap(e.clientX, e.clientY);
    const p = positions.current.get(pr.id)!;
    p.x = q.x + pr.dx;
    p.y = q.y + pr.dy;
    redraw(pr.id);
  };

  // Le molle nascono da un gesto, fuori dal contesto di useSectionAnimation:
  // nessuno le spegnerebbe allo smontaggio.
  const springs = useRef(new Set<gsap.core.Tween>());
  useEffect(() => {
    const live = springs.current;
    return () => {
      for (const t of live) t.kill();
      live.clear();
    };
  }, []);

  const spring = (id: string) => {
    const gsap = gsapRef.current;
    const p = positions.current.get(id)!;
    const r = restPositions.get(id)!;
    if (!gsap) {
      p.x = r.x;
      p.y = r.y;
      redraw(id);
      return;
    }
    const tween = gsap.to(p, {
      x: r.x,
      y: r.y,
      duration: 1.1,
      ease: "elastic.out(1, 0.45)",
      onUpdate: () => redraw(id),
      onComplete: () => {
        springs.current.delete(tween);
      },
    });
    springs.current.add(tween);
  };

  const pointerUp = (e: React.PointerEvent<SVGGElement>) => {
    const pr = grab.current;
    grab.current = null;
    if (!pr) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (pr.moved) {
      spring(pr.id);
      return;
    }
    onTap(pr.id);
  };

  const pointerCancel = () => {
    const pr = grab.current;
    grab.current = null;
    if (pr?.moved) spring(pr.id);
  };

  // Il movimento puo' spegnersi a meta' presa: tutto torna al suo posto.
  useEffect(() => {
    if (full) return;
    for (const [id, r] of restPositions) {
      const p = positions.current.get(id)!;
      if (p.x === r.x && p.y === r.y) continue;
      p.x = r.x;
      p.y = r.y;
      redraw(id);
    }
  }, [full]);

  return { groups, paths, grab, pointerDown, pointerMove, pointerUp, pointerCancel };
}
