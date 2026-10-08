import { DeskStage } from "./DeskStage";
import type { DeskLayerData } from "./DeskTable";
import { ToolboxView } from "./toolbox/ToolboxView";
import type { ToolboxCopy } from "./toolbox/types";

export type ServicesViewProps = {
  eyebrow: string;
  stageTitle: string;
  stageLead: string;
  centre: string;
  /** Il nome del comando sul post-it bianco. Non e' un'etichetta del tavolo:
   *  e' la ventiquattresima cosa, quella che si preme. */
  blank: string;
  /** La nota scritta sul post-it grigio: quello che c'e' scritto sopra prima
   *  che qualcuno lo prema. */
  note: string;
  punch: string;
  layers: DeskLayerData[];
  toolbox: { eyebrow: string; title: string; lead: string; copy: ToolboxCopy };
};

/**
 * Il tavolo: tutto quello che sta sotto un sito finito. I quattro servizi, uno
 * per uno, li stampa la stampante della sezione sopra.
 *
 * Sotto il tavolo c'era «E in pratica?», le quattro voci con i loro disegni e
 * una freccia che le attraversava. E' stata tolta: le quattro descrizioni
 * adesso si leggono sullo scontrino. Al suo posto c'e' la cassetta degli
 * attrezzi, cioe' con cosa lo costruisco.
 */
export function ServicesView({
  eyebrow,
  stageTitle,
  stageLead,
  centre,
  blank,
  note,
  punch,
  layers,
  toolbox,
}: ServicesViewProps) {
  return (
    // Il nome della sezione e' il titolo del tavolo: l'id sta in DeskStage.
    // Scritto a mano in tutti e due i posti perche' DeskStage e' un modulo
    // client, e una costante esportata da li' qui arriverebbe come riferimento
    // client invece che come stringa.
    <section id="services" aria-labelledby="titolo-services" className="relative">
      <DeskStage
        eyebrow={eyebrow}
        title={stageTitle}
        lead={stageLead}
        centre={centre}
        blank={blank}
        note={note}
        punch={punch}
        layers={layers}
      />
      <ToolboxView {...toolbox} />
    </section>
  );
}
