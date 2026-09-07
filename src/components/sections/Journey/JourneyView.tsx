import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { Counter } from "./Counter";
import { JourneyCard } from "./JourneyCard";

export type JourneyEntryView = {
  id: string;
  company: string;
  role: string;
  body: string;
  /** Cosa quel posto ha insegnato. È la cosa nuova: senza, restano tre voci
   *  di curriculum, e il titolo «Dove ho imparato» promette un'altra cosa. */
  lezione: string;
  year: number;
  tesserino: boolean;
  /** Solo la prima: «2025 a oggi». */
  present?: boolean;
};

export type JourneyStat = { id: string; value: string; label: string };

export type JourneyViewProps = {
  eyebrow: string;
  title: string;
  present: string;
  senzaTesserino: string;
  etichettaLezione: string;
  nota: string;
  entries: JourneyEntryView[];
  stats: JourneyStat[];
};

export function JourneyView({
  eyebrow,
  title,
  present,
  senzaTesserino,
  etichettaLezione,
  nota,
  entries,
  stats,
}: JourneyViewProps) {
  return (
    <section
      id="journey"
      className="relative overflow-hidden bg-[var(--accent)] px-[var(--gutter)] py-[var(--section-y)]"
    >
      {/* Il filo passa dietro e non sotto: su un fondo pieno `-z-10` lo
          manderebbe dietro il fondo stesso, cioe' a sparire. Stessa
          impostazione della casella di posta, sezione arancio come questa. */}
      <ThreadSegment section="journey" className="pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-[64rem]">
        {/* Titolo in carta e occhiello in inchiostro, come nella seconda
            sezione: sull'arancio la scala dei toni e' quella, e --on-accent non
            si ribalta col tema mentre --fg-muted si'. */}
        <p className="eyebrow !text-[var(--on-accent)]">{eyebrow}</p>
        <h2 className="mt-3 text-3xl text-[var(--paper)] lg:text-5xl">{title}</h2>

        {/* In fila e non in colonna: l'alternanza destra/sinistra scendendo la
            usano gia' «E in pratica?» e le quattro consegne, e questa sarebbe
            stata la terza volta. Resta una lista ordinata perche' l'ordine e'
            un dato: dal piu' recente, e una prova lo verifica. */}
        <Reveal as="ol" data-journey-list stagger={0.1}>
          {entries.map((entry) => (
            <JourneyCard
              key={entry.id}
              entry={entry}
              present={present}
              senzaTesserino={senzaTesserino}
              etichettaLezione={etichettaLezione}
            />
          ))}
        </Reveal>

        <p data-journey-note>{nota}</p>

        <Reveal as="dl" className="mt-12 flex flex-wrap gap-10" stagger={0.1}>
          {stats.map((stat) => (
            <Counter key={stat.id} value={stat.value} label={stat.label} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
