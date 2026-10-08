import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Garment } from "@/content/toolbox";
import { advance, needleDuration, needlePose, sewnStops } from "./motion";

type Gsap = typeof import("gsap").gsap;

/**
 * L'ago. Parte a ogni capo nuovo, solo a "full": il filo si scopre dietro di
 * lui e le etichette si accendono quando ci passa. Altrimenti il capo e' gia'
 * cucito. In fase di layout: il capo nuovo non deve mostrarsi gia' cucito per
 * un fotogramma prima che l'ago parta.
 *
 * Restituisce i ref da appendere a maschera, filo e ago, e quante tappe del
 * percorso sono cucite (tutte, a riposo).
 */
export function useNeedle({
  garment: capo,
  full: pieno,
  seam: cucitura,
  stops: tappe,
  svg,
  gsapRef,
}: {
  garment: Garment | null;
  full: boolean;
  /** La cucitura del capo, con le curve parziali fino a ogni tappa. */
  seam: { d: string; parziali: string[] };
  /** Quante tappe ha il percorso. */
  stops: number;
  svg: RefObject<SVGSVGElement | null>;
  gsapRef: RefObject<Gsap | null>;
}) {
  const cucituraRef = useRef<SVGPathElement | null>(null);
  const mascheraRef = useRef<SVGPathElement | null>(null);
  const agoRef = useRef<SVGGElement | null>(null);
  const [cuciti, setCuciti] = useState(Number.POSITIVE_INFINITY);

  useLayoutEffect(() => {
    const maschera = mascheraRef.current;
    const filo = cucituraRef.current;
    const ago = agoRef.current;
    const gsap = gsapRef.current;
    if (!capo || !maschera || !filo || !ago) {
      // Via il capo a meta' corsa: l'ago non deve restare fermo sulla mappa.
      if (agoRef.current) agoRef.current.style.opacity = "0";
      return;
    }

    const tutto = () => {
      maschera.style.strokeDasharray = "none";
      maschera.style.strokeDashoffset = "0";
      ago.style.opacity = "0";
      setCuciti(Number.POSITIVE_INFINITY);
    };
    if (!pieno || !gsap || typeof filo.getTotalLength !== "function") {
      tutto();
      return;
    }

    const lunghezza = filo.getTotalLength();
    // Dove sta ogni tappa lungo il filo: le curve parziali misurate da un
    // tracciato di servizio, dentro l'SVG perche' fuori il browser non misura.
    const prova = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    svg.current?.appendChild(prova);
    const soglie = cucitura.parziali.map((d) => {
      prova.setAttribute("d", d);
      return prova.getTotalLength();
    });
    prova.remove();

    maschera.style.strokeDasharray = `${lunghezza} ${lunghezza}`;
    maschera.style.strokeDashoffset = `${lunghezza}`;
    ago.style.opacity = "1";
    setCuciti(1);

    const stato = { q: 0 };
    let fatti = 1;
    const tween = gsap.to(stato, {
      q: 1,
      duration: needleDuration(tappe),
      ease: "none",
      onUpdate: () => {
        const l = stato.q * lunghezza;
        maschera.style.strokeDashoffset = `${lunghezza - l}`;
        const p = filo.getPointAtLength(l);
        const p2 = filo.getPointAtLength(advance(l, lunghezza));
        ago.setAttribute("transform", needlePose(stato.q, p, p2));
        const n = sewnStops(soglie, l, fatti);
        if (n !== fatti) {
          fatti = n;
          setCuciti(n);
        }
      },
      onComplete: tutto,
    });
    return () => {
      tween.kill();
      ago.style.opacity = "0";
      setCuciti(Number.POSITIVE_INFINITY);
    };
  }, [capo, pieno, cucitura, tappe, svg, gsapRef]);

  return { cucituraRef, mascheraRef, agoRef, cuciti };
}
