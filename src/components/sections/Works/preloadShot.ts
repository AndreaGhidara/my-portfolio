import { getImageProps } from "next/image";
import { SHOT_SIZES } from "./WorkShot";
import type { WorkScreenshot } from "./types";

/**
 * Una schermata si scarica una volta sola per sessione. Il mouse su una
 * cartella ci passa sopra dieci volte mentre si legge il sintomo.
 */
const gia = new Set<string>();

/**
 * Chiede la schermata mentre il mouse e' ancora sulla cartella.
 *
 * L'indirizzo lo calcola getImageProps, cioe' la stessa funzione che usa
 * <Image> per scrivere il suo srcset: il browser sceglie la stessa
 * candidata, la trova in cache e il dossier si apre con la schermata gia'
 * dentro. Costruire l'indirizzo a mano vorrebbe dire scaricare due file
 * quasi uguali e non anticipare niente.
 *
 * Da telefono non c'e' hover e il precarico parte al tocco: sono i
 * centocinquanta millisecondi fra il dito che scende e il dito che sale,
 * regalati.
 */
export function preloadShot(shot?: WorkScreenshot) {
  if (!shot || typeof window === "undefined" || gia.has(shot.src)) return;
  gia.add(shot.src);

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
