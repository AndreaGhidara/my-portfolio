"use client";

import Image from "next/image";
import { useState } from "react";
import type { WorkScreenshot } from "./types";

/**
 * Quanto spazio occupa la schermata a schermo. Sta qui, esportato, perche' lo
 * usano in tre: la pratica per chiedere l'immagine, il precarico per chiedere
 * la STESSA immagine mentre il mouse e' ancora sulla cartella, e la faccia
 * della cartella. Sulla faccia la schermata e' mezza pagina e basterebbe una
 * candidata piu' piccola, ma due valori diversi vorrebbero dire due file
 * scaricati al posto di uno: con lo stesso, la pratica la trova gia' in cache.
 */
export const SHOT_SIZES = "(min-width: 1024px) 60rem, 100vw";

/**
 * La schermata del caso, con la sua anteprima sotto.
 *
 * Il difetto che questo componente esiste per togliere: il dossier finiva di
 * aprirsi e la schermata non c'era ancora, poi compariva di colpo dentro un
 * riquadro vuoto. Qui il riquadro non e' mai vuoto. Sotto c'e' subito l'LQIP
 * da venti pixel sfocato, che viaggia nell'HTML e non fa una richiesta; sopra,
 * la schermata vera entra in dissolvenza quando e' arrivata.
 *
 * L'anteprima non si toglie mai: se la schermata non arriva, il riquadro resta
 * quello che era al primo frame invece di svuotarsi.
 *
 * Riempie il riquadro che la contiene, sulla faccia come nella pratica: bordo,
 * angolo e altezza li decide il riquadro.
 */
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
        // Se l'immagine e' gia' in cache puo' essere completa PRIMA che React
        // attacchi onLoad: quell'evento non arriverebbe mai e la schermata
        // resterebbe trasparente per sempre. Ed e' proprio il caso normale
        // quando il precarico ha funzionato.
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
