import { Avatar } from "@/components/brand/Avatar";
import { InkCircle } from "@/components/brand/InkCircle";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { HeroMotion } from "./HeroMotion";
import { CartaStropicciata } from "./CartaStropicciata";

export type HeroViewProps = {
  eyebrow: string;
  wordmarkAlt: string;
  /**
   * Il titolo della pagina come TESTO. Il nome e' disegnato, cioe' sei
   * immagini: un motore di ricerca legge i nodi di testo e gli `alt`, non
   * `aria-label`, quindi l'h1 di questo sito era una stringa vuota e il
   * cognome non compariva in nessun titolo. Qui il testo c'e' davvero, e serve
   * due volte: al crawler e a chi naviga con uno screen reader, che prima
   * sentiva soltanto «Andrea».
   */
  heading: string;
  claim: string;
  subclaim: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scrollHint: string;
};

export function HeroView({
  eyebrow, wordmarkAlt, heading, claim, subclaim, ctaPrimary, ctaSecondary, scrollHint,
}: HeroViewProps) {
  return (
    <section id="hero" className="relative overflow-hidden px-[var(--gutter)] pb-16 pt-6">
      <ThreadSegment section="hero" className="pointer-events-none absolute inset-0 -z-10" />

      {/* Le lettere del nome sono fogli, e si possono appallottolare. Non
          sostituisce le <img>: si sovrappone alla lettera che si sta toccando
          e ne segue il rettangolo, cosi' eredita il parallasse di HeroMotion e
          lascia intatto l'elemento LCP della pagina. Si monta solo a "full". */}
      <CartaStropicciata />

      <HeroMotion>
        <p className="eyebrow">{eyebrow}</p>

        {/* Il nome a filo dei bordi: e' la differenza fra il prototipo
            composto e la versione che ferma qualcuno. */}
        <h1 className="mt-4">
          <span className="sr-only">{heading}</span>
          {/* Il nome disegnato e' la stessa cosa detta a occhio: dentro un h1
              che ha gia' il suo testo diventa decorazione, o uno screen reader
              leggerebbe due volte lo stesso nome. */}
          <span aria-hidden="true" className="flex justify-between gap-[1px]">
            <Wordmark
              text="ANDREA"
              label={wordmarkAlt}
              /* E' l'elemento LCP della pagina, e usciva con loading="lazy":
                 il browser lo metteva in coda proprio mentre lo aspetta. */
              priority
              className="flex w-full justify-between gap-[1px] [&>img]:h-auto [&>img]:w-[15.5%]"
            />
          </span>
        </h1>

        <div data-hero-avatar className="relative z-10 -mt-[6%] flex justify-center">
          <InkCircle className="relative grid size-32 place-items-center lg:size-44">
            <Avatar className="relative z-10 w-[88%]" />
          </InkCircle>
        </div>

        {/* Il blocco sta al centro a ogni larghezza. L'apertura e' l'unico
            posto del sito con un asse centrale, e ce l'ha per costruzione: il
            nome occupa tutta la riga e l'avatar sta esattamente in mezzo.
            Quell'asse lo segna l'avatar, e l'avatar e' centrato anche su uno
            schermo stretto: il testo a sinistra sotto un avatar centrato
            lasciava l'apertura storta proprio nel punto in cui la pagina si
            presenta. L'occhiello invece resta a sinistra a ogni larghezza,
            come su desktop: e' un'etichetta, non fa parte del blocco. */}
        <div data-hero-copy className="mt-6 max-w-2xl mx-auto text-center">
          {/* La scala della pagina, su desktop: il nome disegnato ~110px, i
              due inviti (le cinque email, il tuo turno) 60px, le quattro
              sezioni che spiegano 48px, il corpo 16px.

              Questo claim stava a 24px, cioe' SOTTO tutti e sei i titoli di
              sezione: la tesi che regge la pagina leggeva come didascalia del
              nome. A 48px sta alla pari con le quattro sezioni che spiegano e
              sotto ai due inviti, ed e' giusto che quei due restino i piu'
              forti: sono i momenti in cui si chiede qualcosa a chi legge.

              48 e non 52 o 60 per una ragione misurata, non di gusto: da 52 in
              su la frase va a tre righe, e le tre righe spingono i bottoni
              sotto la piega su uno schermo da 900px.

              `display` e' la classe che in tokens.css veste gli h2: stesso
              carattere dei titoli di sezione. Niente `font-bold` accanto:
              Archivo Black esiste in un peso solo, e chiedergliene un altro
              fa ingrassare le lettere al browser invece che al disegnatore. */}
          <p className="display text-balance text-[2rem] leading-[1.1] text-[var(--fg)] lg:text-[3rem]">
            {claim}
          </p>
          {/* text-balance distribuisce le righe invece di riempirle: senza,
              su schermo stretto "e-commerce" si spezzava in "un e-" e
              "commerce", perche' il browser puo' andare a capo dopo un
              trattino. La parola non si tocca: col trattino unificatore non
              corrisponderebbe piu' a come la gente la cerca. */}
          {/* Il sottotitolo resta nella colonna stretta anche se il claim si e'
              allargato: e' testo da leggere, e oltre le ~75 battute per riga
              l'occhio fatica a trovare l'inizio della riga dopo. */}
          <p className="mt-3 max-w-xl text-balance text-[var(--fg-muted)] mx-auto">
            {subclaim}
          </p>

          {/* L'anello arancione sta di suo su «Parliamone», che e' l'azione
              suggerita, e passa all'altro bottone quando ci si porta sopra: si
              vede sempre quale dei due si sta per scegliere. Il disegno e' in
              tokens.css, sotto [data-hero-cta]. */}
          <div data-hero-cta className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#contact"
              className="rounded-full bg-[var(--fg)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--bg)]"
            >
              {ctaPrimary}
            </a>
            <a
              href="#works"
              className="rounded-full border-2 border-[var(--fg)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--fg)]"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>

        {/* Le due frecce dicono "scorri" senza una parola da tradurre, ma il
            testo resta per chi naviga a voce: un'icona sola non e' un'istruzione.
            Stanno dentro HeroMotion e non dopo: fuori comparivano subito, e si
            invitava a scorrere una pagina che non aveva ancora finito di
            apparire. Sono l'ultimo passo dell'ingresso. */}
        <p data-hero-outro className="mt-10 flex justify-center text-[var(--fg-muted)]">
          <span className="sr-only">{scrollHint}</span>
          <svg
            data-scroll-cue
            aria-hidden="true"
            viewBox="0 0 24 26"
            width="22"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path data-scroll-chevron d="M5 6l7 7 7-7" />
            <path data-scroll-chevron d="M5 13l7 7 7-7" />
          </svg>
        </p>
      </HeroMotion>
    </section>
  );
}
