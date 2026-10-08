"use client";

import Image from "next/image";
import { useState } from "react";
import type { WorkScreenshot } from "./types";

/** Uno solo per faccia, pratica e precarico: sulla faccia basterebbe una
 *  candidata piu' piccola, ma due valori vorrebbero dire due file scaricati, e
 *  la pratica non troverebbe la sua in cache. */
export const SHOT_SIZES = "(min-width: 1024px) 60rem, 100vw";

/** Il riquadro non e' mai vuoto: sotto c'e' subito l'LQIP sfocato, che viaggia
 *  nell'HTML, e non si toglie mai, cosi' se la schermata non arriva resta
 *  quello del primo frame. */
export function WorkShot({ shot, alt }: { shot: WorkScreenshot; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    // E' il contenitore a ritagliare anche l'anteprima, che sborda per via
    // della sfocatura.
    <span className="relative block size-full overflow-hidden">
      <span
        aria-hidden="true"
        data-shot-blur
        // scale: la sfocatura sfuma anche i bordi, e senza un filo di
        // ingrandimento si vedrebbe il contorno chiaro del riquadro.
        className="absolute inset-0 scale-105 bg-cover bg-top blur-xl"
        style={{ backgroundImage: `url("${shot.blurDataURL}")` }}
      />

      <Image
        src={shot.src}
        alt={alt}
        width={shot.width}
        height={shot.height}
        sizes={SHOT_SIZES}
        data-loaded={loaded ? "" : undefined}
        onLoad={() => setLoaded(true)}
        // Dalla cache l'immagine puo' essere completa PRIMA che React attacchi
        // onLoad: l'evento non arriverebbe mai, ed e' il caso normale quando il
        // precarico ha funzionato.
        ref={(node) => {
          if (node?.complete) setLoaded(true);
        }}
        // Il tetto e' il riquadro. Si taglia dal basso e da destra: la testata
        // del sito, in alto a sinistra, e' la parte che lo fa riconoscere.
        className={`relative block size-full object-cover object-left-top transition-opacity duration-500 motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
