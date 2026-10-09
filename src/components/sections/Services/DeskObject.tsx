import type { CSSProperties } from "react";
import type { DeskShape, SampleId } from "@/content/desk";
import { DeskSpecimen } from "./DeskSpecimen";
import { hasLeds } from "./materials";
import {
  LABEL,
  SHAPE_BOX,
  drawWidth,
  type Beat,
  type DeskDrawing,
  type Placement,
} from "./layers";

// Due strati perche' una maschera CSS dipinge un colore solo: pieno sotto,
// tracciato sopra, in ordine di DOM e non di z-index. I led sono colore, non
// forma, e nessuna maschera li puo' portare.
export function DeskShapeArt({ drawing }: { drawing: DeskDrawing }) {
  const box = SHAPE_BOX[drawing];
  return (
    <span data-desk-shape data-shape={drawing} style={{ aspectRatio: `${box.w} / ${box.h}` }}>
      <span data-desk-fill />
      <span data-desk-line />
      {hasLeds(drawing) ? <span data-desk-leds /> : null}
    </span>
  );
}

// Maschere CSS e non <img>: dentro un'<img> il currentColor non segue il tema.
// L'opacita' legge `var(--p, 1)`: senza JavaScript --p non c'e' e si vede il
// tavolo completo. data-desk-object conta le ventiquattro cose del tavolo,
// data-desk-piece porta materiali e campione anche ai disegni fuori dal tavolo.
export function DeskObject({
  shape,
  label,
  sample,
  placement,
  beat,
  href,
  action,
  note,
}: {
  shape: DeskShape;
  label: string | null;
  sample?: SampleId;
  placement: Placement;
  beat: Beat;
  href?: string;
  /** Il nome accessibile del comando: si vede solo al passaggio, si legge sempre. */
  action?: string;
  note?: string;
}) {
  const shapeArt = <DeskShapeArt drawing={shape} />;

  const specimen = sample ? <DeskSpecimen sample={sample} /> : null;

  return (
    <li
      data-desk-object
      data-desk-piece
      data-shape={shape}
      style={
        {
          left: `${placement.x}%`,
          top: `${placement.y}%`,
          width: `${drawWidth(shape)}%`,
          "--rot": `${placement.rotate}deg`,
          "--from": beat.from,
          "--span": beat.span,
          opacity: "clamp(0, (var(--p, 1) - var(--from)) / var(--span), 1)",
        } as CSSProperties
      }
    >
      {href ? (
        <a href={href} data-desk-blank>
          {shapeArt}
          {/* aria-hidden: il nome del comando e' la domanda qui sotto, e due
              testi dentro un <a> lo annuncerebbero due volte. */}
          {note ? (
            <span data-desk-note aria-hidden="true">
              {note}
            </span>
          ) : null}
          {/* Con opacity 0 resta nell'albero di accessibilita'. Niente
              data-desk-label: le etichette del tavolo restano ventitre'. */}
          <span data-desk-ask>{action}</span>
        </a>
      ) : (
        <>
          {shapeArt}
          {specimen}
          {/* Da LABEL e non dal CSS: e' il numero con cui objectFootprint
              tiene le distanze. */}
          {label ? (
            <span data-desk-label style={{ maxWidth: `${LABEL.width}em` }}>
              {label}
            </span>
          ) : null}
        </>
      )}
    </li>
  );
}
