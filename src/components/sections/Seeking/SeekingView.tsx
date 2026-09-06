import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { SeekingStrade, type SeekingStrada } from "./SeekingStrade";

export type SeekingViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  /** «Non e' un modulo»: il patto, scritto dove si prende la decisione. */
  attesa: string;
  etichettaTipo: string;
  strade: SeekingStrada[];
};

/**
 * La seconda sezione: quella che deve guadagnarsi il diritto di dire tutto il
 * resto. Prima erano quattro frasi che rispecchiavano il visitatore e una
 * chiusa che gli faceva un complimento — «la parte difficile l'hai gia' fatta:
 * sai cosa ti serve» — che era anche falsa: chi arriva conosce un sintomo, non
 * il problema, e dirgli il contrario toglie a questo sito la ragione per cui
 * dovrebbe scrivergli.
 *
 * Adesso chiede e RISPONDE. Cinque strade ordinate per quanto toccano di
 * quello che uno ha gia', e ognuna si porta dietro cosa significa davvero, una
 * cosa da verificare da soli oggi, e dove nella pagina sta la prova.
 *
 * Le virgolette attorno al blocco sono sparite con le frasi: aprivano e
 * chiudevano quattro voci di persone diverse come se fossero un unico brano
 * citato, e qui non c'e' piu' niente da citare — sono scelte, non voci.
 */
export function SeekingView({
  eyebrow,
  title,
  intro,
  attesa,
  etichettaTipo,
  strade,
}: SeekingViewProps) {
  return (
    <section
      id="seeking"
      className="relative overflow-hidden bg-[var(--accent)] px-[var(--gutter)] py-[var(--section-y)]"
    >
      <ThreadSegment section="seeking" className="pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-5xl">
        <p className="eyebrow !text-[var(--on-accent)]">{eyebrow}</p>
        <h2 className="mt-3 text-4xl text-[var(--paper)] lg:text-6xl">{title}</h2>
        <p data-seeking-intro className="mt-4 max-w-2xl text-[var(--on-accent)]">
          {intro}
        </p>

        <SeekingStrade strade={strade} titolo={title} etichettaTipo={etichettaTipo} />

        <p data-seeking-attesa className="mt-6 max-w-2xl text-[var(--on-accent)]">
          {attesa}
        </p>
      </div>
    </section>
  );
}
