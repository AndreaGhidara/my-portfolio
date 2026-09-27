import { DeskStage } from "./DeskStage";
import type { DeskLayerData } from "./DeskTable";

export type ServicesViewProps = {
  eyebrow: string;
  stageTitle: string;
  stageLead: string;
  centre: string;
  /** Il titolino sopra i quattro strati. Si vede solo sotto i 1024px: da
      desktop gli strati arrivano uno alla volta con la camera, e un titolo
      fisso sopra la scena sarebbe una didascalia che non aspetta nessuno. */
  composto: string;
  /** Il nome del comando sul post-it bianco. Non e' un'etichetta del tavolo:
   *  e' la ventiquattresima cosa, quella che si preme. */
  blank: string;
  /** La nota scritta sul post-it grigio: quello che c'e' scritto sopra prima
   *  che qualcuno lo prema. */
  note: string;
  punch: string;
  layers: DeskLayerData[];
};

/**
 * Il tavolo: tutto quello che sta sotto un sito finito. I quattro servizi, uno
 * per uno, li stampa la stampante della sezione sopra.
 *
 * Sotto il tavolo c'era «E in pratica?», le quattro voci con i loro disegni e
 * una freccia che le attraversava. E' stata tolta: le quattro descrizioni
 * adesso si leggono sullo scontrino.
 */
export function ServicesView({
  eyebrow,
  stageTitle,
  stageLead,
  centre,
  composto,
  blank,
  note,
  punch,
  layers,
}: ServicesViewProps) {
  return (
    <section id="services" className="relative">
      {/* Niente <ThreadSegment> qui: in questa sezione il filo SONO i cavi, dentro
          il tavolo. Due tratti sovrapposti sarebbero due fili, ed e' esattamente
          la cosa che il concept vieta. */}
      <DeskStage
        eyebrow={eyebrow}
        title={stageTitle}
        lead={stageLead}
        centre={centre}
        composto={composto}
        blank={blank}
        note={note}
        punch={punch}
        layers={layers}
      />
    </section>
  );
}
