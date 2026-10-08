import { DeskStage } from "./DeskStage";
import type { DeskLayerData } from "./DeskTable";
import { ToolboxView } from "./toolbox/ToolboxView";
import type { ToolboxCopy } from "./toolbox/types";

export type ServicesViewProps = {
  eyebrow: string;
  stageTitle: string;
  stageLead: string;
  centre: string;
  /** Il nome del comando sul post-it bianco. */
  blank: string;
  /** Il testo scritto sul post-it, che non e' il nome del comando. */
  note: string;
  punch: string;
  layers: DeskLayerData[];
  toolbox: { eyebrow: string; title: string; lead: string; copy: ToolboxCopy };
};

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
    // L'id del titolo e' scritto a mano anche in DeskStage: una costante
    // esportata da un modulo client qui arriverebbe come riferimento, non stringa.
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
