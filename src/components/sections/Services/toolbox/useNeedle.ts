import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Garment } from "@/content/toolbox";
import { advance, needleDuration, needlePose, sewnStops } from "./motion";

type Gsap = typeof import("gsap").gsap;

// Solo a "full"; altrimenti il capo e' gia' cucito e `sewn` vale infinito.
// In fase di layout: il capo nuovo non deve mostrarsi cucito per un
// fotogramma prima che l'ago parta.
export function useNeedle({
  garment,
  full,
  seam,
  stops,
  svg,
  gsapRef,
}: {
  garment: Garment | null;
  full: boolean;
  seam: { d: string; partials: string[] };
  stops: number;
  svg: RefObject<SVGSVGElement | null>;
  gsapRef: RefObject<Gsap | null>;
}) {
  const seamRef = useRef<SVGPathElement | null>(null);
  const maskRef = useRef<SVGPathElement | null>(null);
  const needleRef = useRef<SVGGElement | null>(null);
  const [sewn, setSewn] = useState(Number.POSITIVE_INFINITY);

  useLayoutEffect(() => {
    const mask = maskRef.current;
    const thread = seamRef.current;
    const needle = needleRef.current;
    const gsap = gsapRef.current;
    if (!garment || !mask || !thread || !needle) {
      // Via il capo a meta' corsa: l'ago non deve restare fermo sulla mappa.
      if (needleRef.current) needleRef.current.style.opacity = "0";
      return;
    }

    const showAll = () => {
      mask.style.strokeDasharray = "none";
      mask.style.strokeDashoffset = "0";
      needle.style.opacity = "0";
      setSewn(Number.POSITIVE_INFINITY);
    };
    if (!full || !gsap || typeof thread.getTotalLength !== "function") {
      showAll();
      return;
    }

    const length = thread.getTotalLength();
    // Il tracciato di servizio sta dentro l'SVG: fuori il browser non misura.
    const probe = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    svg.current?.appendChild(probe);
    const thresholds = seam.partials.map((d) => {
      probe.setAttribute("d", d);
      return probe.getTotalLength();
    });
    probe.remove();

    mask.style.strokeDasharray = `${length} ${length}`;
    mask.style.strokeDashoffset = `${length}`;
    needle.style.opacity = "1";
    setSewn(1);

    const state = { q: 0 };
    let done = 1;
    const tween = gsap.to(state, {
      q: 1,
      duration: needleDuration(stops),
      ease: "none",
      onUpdate: () => {
        const l = state.q * length;
        mask.style.strokeDashoffset = `${length - l}`;
        const p = thread.getPointAtLength(l);
        const p2 = thread.getPointAtLength(advance(l, length));
        needle.setAttribute("transform", needlePose(state.q, p, p2));
        const n = sewnStops(thresholds, l, done);
        if (n !== done) {
          done = n;
          setSewn(n);
        }
      },
      onComplete: showAll,
    });
    return () => {
      tween.kill();
      needle.style.opacity = "0";
      setSewn(Number.POSITIVE_INFINITY);
    };
  }, [garment, full, seam, stops, svg, gsapRef]);

  return { seamRef, maskRef, needleRef, sewn };
}
