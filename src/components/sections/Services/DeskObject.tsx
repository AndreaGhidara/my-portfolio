import type { CSSProperties } from "react";
import type { DeskShape } from "@/content/desk";
import { LABEL, SHAPE_BOX, drawWidth, type Beat, type DeskLayout, type Placement } from "./layers";

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
 *
 * Ventitre' oggetti su ventiquattro sono un disegno con una parola sotto. Il
 * ventiquattresimo — il post-it bianco — e' un comando, e allora la sagoma sta
 * dentro un <a>: l'unica cosa del tavolo che si preme.
 */
export function DeskObject({
  shape,
  label,
  layout,
  placement,
  beat,
  hidden,
  ghost,
  href,
  action,
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
  /** Solo il post-it bianco ce l'ha. */
  href?: string;
  /** Il nome accessibile del comando. Sul tavolo non si vede finche' non lo si
   *  sfiora, ma si legge sempre: e' il nome che annuncia uno screen reader. */
  action?: string;
}) {
  const box = SHAPE_BOX[shape];
  const sagoma = <span data-desk-shape style={{ aspectRatio: `${box.w} / ${box.h}` }} />;

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
      {href ? (
        // Il comando sta in tutti e due i mondi, perche' il post-it si disegna
        // in tutti e due: sotto i 1024px quello che si vede e' il gemello, e un
        // post-it che porta da qualche parte ma non si preme sarebbe un disegno
        // di un comando. Nel gemello pero' e' una superficie da toccare e basta:
        // il gemello e' aria-hidden per intero, e un secondo <a> nel giro dei
        // Tab sarebbe una fermata che non annuncia niente. Niente domanda
        // scritta, per la stessa ragione — li' non si legge (e a quella misura
        // non si leggerebbe comunque): il nome del comando lo porta l'altro
        // mondo, che sotto i 1024px e' quello che uno screen reader legge.
        <a href={href} data-desk-blank tabIndex={ghost ? -1 : undefined}>
          {sagoma}
          {/* La domanda e' il nome del comando: con opacity 0 non si vede, ma
              resta nell'albero di accessibilita' ed e' quella che uno screen
              reader annuncia. Niente data-desk-label — questa non e' una voce
              dell'elenco, e il conteggio delle etichette resta ventitre'. */}
          {ghost ? null : <span data-desk-ask>{action}</span>}
        </a>
      ) : (
        <>
          {sagoma}
          {/* La larghezza massima della striscia arriva da LABEL e non dal CSS:
              e' con quel numero che objectFootprint tiene le distanze, e se il
              foglio di stile ne usasse un altro la prova misurerebbe un tavolo
              diverso da quello disegnato. */}
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
