import { QuoteFrame } from "@/components/brand/QuoteFrame";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { SeekingVoices } from "./SeekingVoices";

export type SeekingItem = { id: string; voice: string };

export type SeekingViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  outro: string;
  items: SeekingItem[];
};

/**
 * Il momento del riconoscimento, ed e' il piu' rumoroso della pagina: le
 * quattro frasi sono virgolettate perche' sono SUE, non mie. "Offro
 * automazioni" e' una descrizione; "voglio smettere di fare a mano quello che
 * potrebbe farsi da solo" e' una cosa che si e' gia' detto a voce alta.
 *
 * Sta sull'arancio, e le virgolette grandi che prima incorniciavano i servizi
 * vengono qui: e' l'unico blocco della pagina che contiene delle citazioni
 * vere, e li' quel segno significa qualcosa.
 *
 * Vincolo di contrasto: sull'arancio la carta e' 3,3:1, ammessa solo per testo
 * grande. Le frasi lo sono; tutto il testo corrente resta inchiostro (5,1:1).
 */
export function SeekingView({ eyebrow, title, intro, outro, items }: SeekingViewProps) {
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

        {/* Le virgolette aprono e chiudono le QUATTRO FRASI, non la sezione.
            Agli angoli del blocco finivano sotto l'header fisso, e su mobile
            sopra il contenuto non c'e' lo spazio per tenercele: qui invece
            sono al posto giusto anche per quello che significano — sono
            citazioni vere, e quel segno le apre. */}
        <QuoteFrame
          variant="open"
          className="mt-12 block w-16 lg:mt-16 lg:w-24 [&_img]:h-auto [&_img]:w-full [&_img]:brightness-0 [&_img]:invert"
        />

        <SeekingVoices items={items} />

        <QuoteFrame
          variant="close"
          className="ml-auto mt-6 block w-12 lg:w-16 [&_img]:h-auto [&_img]:w-full [&_img]:brightness-0 [&_img]:invert"
        />

        <p className="mt-10 max-w-2xl text-[var(--on-accent)] lg:mt-14">{outro}</p>
      </div>
    </section>
  );
}
