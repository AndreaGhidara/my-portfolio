import type { CSSProperties } from "react";
import { Reveal } from "@/animations/components/Reveal";
import { POSA_ARRIVO, posa } from "./binario";
import { JourneyBinario } from "./JourneyBinario";
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
  /** Solo la tappa corrente: «2026 a oggi». */
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
  /** «continua a scorrere»: sotto la fila, finche' non si scorre. */
  suggerimento: string;
  /** Nell'ordine in cui si percorrono: dalla prima tappa a oggi. */
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
  suggerimento,
  entries,
  stats,
}: JourneyViewProps) {
  return (
    // overflow clip e non hidden: hidden fa della sezione un contenitore di
    // scorrimento e il palco sticky non aggancia. Su tutti e due gli assi, a
    // differenza di #services e #process che tagliano solo in x (vedi la
    // regola in tokens.css): qui in x il binario e' largo
    // migliaia di pixel e in y il foglio dei numeri che cade deve sparire sul
    // bordo della sezione, non finire sopra «Il tuo turno». clip non crea un
    // contenitore di scorrimento, quindi lo sticky regge.
    <section id="journey" data-fondo="accento" className="relative overflow-clip bg-[var(--accent)]">
      {/* Il filo del sito si interrompe qui, come sul tavolo: la riga di questa
          sezione e' l'onda, dello stesso colore. */}
      <JourneyBinario
        n={entries.length}
        annoIniziale={entries[0]?.year ?? 0}
        suggerimento={suggerimento}
        testata={
          // Titolo in carta e occhiello in inchiostro, come nella seconda
          // sezione: sull'arancio la scala dei toni e' quella, e --on-accent
          // non si ribalta col tema mentre --fg-muted si'.
          <Reveal moto="dietro" stagger={0.08}>
            <p className="eyebrow !text-[var(--on-accent)]">{eyebrow}</p>
            <h2>{title}</h2>
          </Reveal>
        }
      >
        {entries.map((entry, i) => (
          <JourneyCard
            key={entry.id}
            entry={entry}
            posa={posa(i)}
            present={present}
            senzaTesserino={senzaTesserino}
            etichettaLezione={etichettaLezione}
          />
        ))}

        {/* L'ultima fermata: i due numeri su un foglio piccolo della stessa
            carta delle tappe. La <dl> e' piatta, niente conteggio: dentro un
            palco agganciato l'innesco verticale del contatore scatterebbe
            all'aggancio e non all'arrivo, e il momento di questo foglio e' la
            luce. */}
        <li
          data-journey-arrivo
          style={{ "--r": `${POSA_ARRIVO.rotazione}deg` } as CSSProperties}
        >
          <dl>
            {stats.map((stat) => (
              // L'etichetta una volta sola, in <dt>: l'ordine dt -> dd resta
              // quello della specifica, e il CSS mostra il numero sopra.
              <div key={stat.id}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p data-journey-note>{nota}</p>
        </li>
      </JourneyBinario>
    </section>
  );
}
