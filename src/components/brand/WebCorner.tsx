"use client";

import { useRef } from "react";
import { weave } from "@/animations/presets";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

/**
 * La ragnatela è la parola "web" presa alla lettera, e va sempre DISEGNATA
 * in ingresso, mai lasciata statica: statica si legge come trascuratezza,
 * in tessitura si legge come lavoro in corso.
 * L'SVG è in linea, non via <img>, perché servono i singoli <path> per
 * animarli uno a uno — e perché a ~1 KB una richiesta di rete in più sul
 * percorso critico dell'hero non si giustifica.
 */
export function WebCorner({ className }: { className?: string }) {
  const scope = useRef<HTMLElement | null>(null);

  useSectionAnimation((level) => {
    const paths = Array.from(scope.current?.querySelectorAll("path") ?? []);
    weave(paths as SVGPathElement[], { level, stagger: 0.06 });
  }, scope);

  return (
    <span
      ref={scope}
      aria-hidden="true"
      className={className}
      data-web-corner
      style={{ color: "var(--line)" }}
      dangerouslySetInnerHTML={{ __html: WEB_CORNER_SVG }}
    />
  );
}

/**
 * Contenuto di public/brand/web-corner.svg, incorporato.
 * Se rigeneri con `npm run assets`, aggiorna anche questa costante.
 */
const WEB_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
  <path d="M0 0 L420 0" />
  <path d="M0 0 L399.44 129.79" />
  <path d="M0 0 L339.79 246.87" />
  <path d="M0 0 L246.87 339.79" />
  <path d="M0 0 L129.79 399.44" />
  <path d="M0 0 L0 420" />
  <path d="M57.14 0 Q47.41 7.51 54.35 17.66 Q42.77 21.79 46.23 33.59 Q33.94 33.94 33.59 46.23 Q21.79 42.77 17.66 54.35 Q7.51 47.41 0 57.14" />
  <path d="M114.29 0 Q94.82 15.02 108.69 35.32 Q85.54 43.58 92.46 67.18 Q67.88 67.88 67.18 92.46 Q43.58 85.54 35.32 108.69 Q15.02 94.82 0 114.29" />
  <path d="M171.43 0 Q142.23 22.53 163.04 52.97 Q128.3 65.37 138.69 100.76 Q101.82 101.82 100.76 138.69 Q65.37 128.3 52.97 163.04 Q22.53 142.23 0 171.43" />
  <path d="M228.57 0 Q189.64 30.04 217.38 70.63 Q171.07 87.17 184.92 134.35 Q135.76 135.76 134.35 184.92 Q87.17 171.07 70.63 217.38 Q30.04 189.64 0 228.57" />
  <path d="M285.71 0 Q237.05 37.54 271.73 88.29 Q213.84 108.96 231.15 167.94 Q169.71 169.71 167.94 231.15 Q108.96 213.84 88.29 271.73 Q37.54 237.05 0 285.71" />
  <path d="M342.86 0 Q284.45 45.05 326.08 105.95 Q256.61 130.75 277.38 201.53 Q203.65 203.65 201.53 277.38 Q130.75 256.61 105.95 326.08 Q45.05 284.45 0 342.86" />
  <path d="M400 0 Q331.86 52.56 380.42 123.61 Q299.38 152.54 323.61 235.11 Q237.59 237.59 235.11 323.61 Q152.54 299.38 123.61 380.42 Q52.56 331.86 0 400" />
</svg>`;
