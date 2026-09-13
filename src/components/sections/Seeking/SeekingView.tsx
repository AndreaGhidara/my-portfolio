import { ThreadSegment } from "@/components/thread/ThreadSegment";
import {
  SeekingCasella,
  type SeekingMail,
  type SeekingCasellaChrome,
} from "./SeekingCasella";

export type SeekingViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  /** «Non e' un modulo»: il patto, scritto dove si prende la decisione. */
  attesa: string;
  etichettaTipo: string;
  casella: SeekingCasellaChrome;
  mail: SeekingMail[];
};

/**
 * La seconda sezione: quella che deve guadagnarsi il diritto di dire tutto il
 * resto. Prima erano quattro frasi che rispecchiavano il visitatore e una
 * chiusa che gli faceva un complimento — «la parte difficile l'hai gia' fatta:
 * sai cosa ti serve» — che era anche falsa. Poi sono diventate cinque strade
 * con la risposta dentro: chiedeva e rispondeva.
 *
 * Adesso non chiede piu' niente. «Queste sono le cinque email che ricevo piu'
 * spesso, e queste sono le mie risposte»: il visitatore non compila, legge la
 * posta di qualcun altro e ci si riconosce. E' generoso, e' una prova di
 * competenza invece di una promessa, e giustifica da solo la riga sotto — che
 * resta, perche' e' vera: la scelta non parte da nessuna parte.
 *
 * I contenuti delle cinque non sono cambiati con la forma. Quello che e'
 * cambiato e' da che parte si guardano.
 */
export function SeekingView({
  eyebrow,
  title,
  intro,
  attesa,
  etichettaTipo,
  casella,
  mail,
}: SeekingViewProps) {
  return (
    <section
      id="seeking"
      data-fondo="accento"
      className="relative overflow-hidden bg-[var(--accent)] px-[var(--gutter)] py-[var(--section-y)]"
    >
      {/* Il filo passa dietro, e per il tratto centrale la casella se lo
          mangia: e' un blocco di carta pieno, non un riquadro arancione come
          quelli di prima. Entra sopra il titolo ed esce sotto il patto, ed e'
          li' che si vede — la continuita' con le sezioni vicine e' salva. */}
      {/* Niente opacity: sbiadire il filo qui lo moltiplicava per 0,4 su un
          tratto gia' dipinto al 29% dall'antialiasing, e su arancio spariva
          del tutto (1,09:1 misurato in pagina). Il tono giusto su un fondo
          pieno lo da' --filo, che qui vale --on-accent. */}
      <ThreadSegment section="seeking" className="pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-5xl">
        <p className="eyebrow !text-[var(--on-accent)]">{eyebrow}</p>
        <h2 className="mt-3 text-4xl text-[var(--paper)] lg:text-6xl">{title}</h2>
        <p data-seeking-intro className="mt-4 max-w-2xl text-[var(--on-accent)]">
          {intro}
        </p>

        <SeekingCasella
          mail={mail}
          titolo={title}
          etichettaTipo={etichettaTipo}
          casella={casella}
        />

        <p data-seeking-attesa className="mt-6 max-w-2xl text-[var(--on-accent)]">
          {attesa}
        </p>
      </div>
    </section>
  );
}
