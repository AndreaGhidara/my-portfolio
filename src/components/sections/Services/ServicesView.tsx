import { Reveal } from "@/animations/components/Reveal";
import { DeskStage } from "./DeskStage";
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
 * spettacolo, quel blocco e' la sostanza, e conserva la risposta 1:1 alle quattro
 * voci. Se un giorno pesa, si toglie senza toccare il tavolo.
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

      <div className="mx-auto max-w-5xl px-[var(--gutter)] pb-[var(--section-y)]">
        <h3 className="text-2xl lg:text-4xl">{practice}</h3>
        <p className="mt-4 max-w-2xl text-[var(--fg-muted)]">{intro}</p>

        <Reveal as="ol" data-practice className="mt-10 border-t border-[var(--line)]" stagger={0.09}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-2 border-b border-[var(--line)] py-7 lg:grid-cols-[13rem_1fr] lg:gap-8 lg:py-9"
            >
              <div className="lg:pt-1">
                <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
                {/* Livello 4: queste quattro voci stanno dentro "E in pratica?",
                    che e' il loro <h3>. Al livello 3 sarebbero fratelle del
                    titolo che le contiene. */}
                <h4 className="mt-1 text-lg font-bold leading-tight text-[var(--fg)] lg:text-xl">
                  {item.title}
                </h4>
              </div>
              <p className="max-w-2xl leading-relaxed text-[var(--fg-muted)]">{item.description}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
