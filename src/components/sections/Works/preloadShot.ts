import { getImageProps } from "next/image";
import { SHOT_SIZES } from "./WorkShot";
import type { WorkScreenshot } from "./types";

// Il mouse passa sopra una cartella dieci volte: si chiede una volta sola.
const requested = new Set<string>();

/** L'indirizzo lo calcola getImageProps, la stessa funzione che usa <Image> per
 *  il suo srcset: il browser sceglie la stessa candidata e la trova in cache.
 *  Costruirlo a mano vorrebbe dire scaricare due file quasi uguali. */
export function preloadShot(shot?: WorkScreenshot) {
  if (!shot || typeof window === "undefined" || requested.has(shot.src)) return;
  requested.add(shot.src);

  const { props } = getImageProps({
    src: shot.src,
    alt: "",
    width: shot.width,
    height: shot.height,
    sizes: SHOT_SIZES,
  });

  const img = new window.Image();
  // sizes e srcset prima di src: sono loro a decidere quale candidata parte, e
  // assegnare src per primo farebbe partire quella sbagliata.
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
}
