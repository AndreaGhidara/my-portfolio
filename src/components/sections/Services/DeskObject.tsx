import type { CSSProperties } from "react";
import type { DeskShape } from "@/content/desk";
import { SHAPE_BOX, drawWidth, type Beat, type DeskLayout, type Placement } from "./layers";

/**
 * Un oggetto sul tavolo. E' un <li>, non un <div> che finge: lo strato e' una
 * lista e questo e' uno dei suoi elementi. Quello che lo rende un oggetto su un
 * tavolo invece che una voce in colonna sono le coordinate, e stanno in uno
 * style inline perche' sono dati, non design.
 *
 * L'opacita' e' scritta in CSS e non in JavaScript: dipende da --p, che il palco
 * aggiornera' una volta per fotogramma. Il default `var(--p, 1)` e' il patto del
 * fallback — se il JavaScript non gira, --p non viene mai scritta, vale 1, e si
 * vede il tavolo completo. Il fotogramma finale e' lo stato di riposo.
 *
 * La sagoma e' una maschera CSS e non una <img>: dentro una <img> il
 * `currentColor` degli SVG si risolve sul documento dell'immagine, che non sa
 * niente del tema, e i disegni resterebbero neri anche su fondo inchiostro.
 * Come maschera il colore lo mette chi la contiene, e segue carta e inchiostro.
 */
export function DeskObject({
  shape,
  label,
  layout,
  placement,
  beat,
  hidden,
  ghost,
}: {
  shape: DeskShape;
  label: string | null;
  layout: DeskLayout;
  placement: Placement;
  beat: Beat;
  /** Fuori dai primi quattro: sparisce dal DISEGNO sul telefono, non dalla lista. */
  hidden: boolean;
  /** Il gemello che il CSS nasconde: si disegna, ma non si legge. */
  ghost: boolean;
}) {
  const box = SHAPE_BOX[shape];

  return (
    <li
      data-desk-object
      data-shape={shape}
      data-ghost={ghost ? "" : undefined}
      data-off={hidden ? "" : undefined}
      style={
        {
          left: `${placement.x}%`,
          top: `${placement.y}%`,
          width: `${drawWidth(layout, shape)}%`,
          "--rot": `${placement.rotate}deg`,
          "--from": beat.from,
          "--span": beat.span,
          opacity: "clamp(0, (var(--p, 1) - var(--from)) / var(--span), 1)",
        } as CSSProperties
      }
    >
      <span data-desk-shape style={{ aspectRatio: `${box.w} / ${box.h}` }} />
      {label ? <span data-desk-label>{label}</span> : null}
    </li>
  );
}
