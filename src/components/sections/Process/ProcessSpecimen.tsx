import type { CSSProperties, ReactNode } from "react";
import type { ProcessSample } from "@/content/process";

/** Una tavola sua e non quella del tavolo: la prova di DeskSpecimen esige che
 *  ogni disegno sia reclamato da uno dei ventiquattro oggetti, e questi non lo
 *  sono. Le marche e le sagome invece sono le stesse. */

/** La larghezza e' un dato del disegno, non una scelta di stile. */
const SpecimenLine = ({ w, ...rest }: { w: number; "data-title"?: string; "data-url"?: string }) => (
  <i data-m="line" {...rest} style={{ "--w": `${w}%` } as CSSProperties} />
);

export const PROCESS_SPECIMENS: Record<ProcessSample, ReactNode> = {
  accordo: (
    <>
      <SpecimenLine w={46} data-title="" />
      <SpecimenLine w={100} />
      <SpecimenLine w={88} />
      <SpecimenLine w={96} />
      <SpecimenLine w={38} data-url="" />
      <SpecimenLine w={74} />
      <SpecimenLine w={58} />
    </>
  ),
  bozza: (
    <>
      <i data-m="block" data-b="header" />
      <span data-m="columns">
        <i data-m="block" data-b="wide" />
        <i data-m="block" data-b="narrow" />
      </span>
      <i data-m="cta" data-small="" />
    </>
  ),
  /** «Il telefono» del tavolo e' lo stesso impaginato SENZA la barra: la barra
   *  dell'indirizzo e' tutta la differenza. */
  indirizzo: (
    <>
      <SpecimenLine w={100} data-title="" />
      <i data-m="block" data-b="header" />
      <SpecimenLine w={100} />
      <SpecimenLine w={100} />
      <SpecimenLine w={80} />
      <i data-m="cta" />
    </>
  ),
  /** Il numero NON c'e', solo la sua forma: inventarne uno sarebbe una bugia, e
   *  sceglierne uno vero riguarda i Contatti. */
  numero: (
    <>
      <SpecimenLine w={54} />
      <b data-m="mono">+39 ___ ___ ____</b>
      <SpecimenLine w={34} data-url="" />
    </>
  ),
};

/** Accanto alla sagoma e non dentro: [data-desk-shape] porta l'ombra, che su
 *  ognuna delle marche impasterebbe il disegno. */
export function ProcessSpecimen({ sample }: { sample: ProcessSample }) {
  return (
    <span data-desk-sample={sample} aria-hidden="true">
      {PROCESS_SPECIMENS[sample]}
    </span>
  );
}
