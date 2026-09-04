import { DeskStage } from "./DeskStage";
import { Practice } from "./Practice";
import type { DeskLayerData } from "./DeskTable";

export type ServiceItem = { id: string; title: string; description: string };

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
  practice: string;
  intro: string;
  layers: DeskLayerData[];
  items: ServiceItem[];
};

/**
 * La risposta alle quattro frasi della sezione precedente. Non e' un elenco di
 * risposte: e' un tavolo, e la risposta e' "qualunque delle quattro sia la tua,
 * il lavoro e' questo tavolo qui".
 *
 * "E in pratica?" viene dopo, ed e' deliberatamente separabile: il tavolo e' lo
 * spettacolo, quella scena e' la sostanza, e conserva la risposta 1:1 alle
 * quattro voci. Costa una scena — quattro voci alternate testo|disegno, con gli
 * stessi oggetti del tavolo ingranditi — e non piu' un elenco asciutto. Se un
 * giorno pesa, si toglie senza toccare il tavolo.
 */
export function ServicesView({
  eyebrow,
  stageTitle,
  stageLead,
  centre,
  blank,
  note,
  punch,
  practice,
  intro,
  layers,
  items,
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
        blank={blank}
        note={note}
        punch={punch}
        layers={layers}
      />

      {/* Il palco e' largo 74rem e non 64: non e' una colonna di lettura, e'
          una scena in cui un braccio deve poter oscillare. Il testo dentro
          resta a 36ch. La misura e' anche quella su cui il gesto e' stato
          calibrato, cosi' i numeri partono vicini al punto giusto. */}
      <Practice practice={practice} intro={intro} items={items} />
    </section>
  );
}
