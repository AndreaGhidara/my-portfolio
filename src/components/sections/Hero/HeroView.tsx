import { Avatar } from "@/components/brand/Avatar";
import { InkCircle } from "@/components/brand/InkCircle";
import { Wordmark } from "@/components/brand/Wordmark";
import { HeroMotion } from "./HeroMotion";
import { CrumpledPaper } from "./CrumpledPaper";

export type HeroViewProps = {
  eyebrow: string;
  wordmarkAlt: string;
  avatarAlt: string;
  /** Il nome e' fatto di immagini: senza questo testo l'h1 era vuoto per i motori di ricerca. */
  heading: string;
  claim: string;
  subclaim: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scrollHint: string;
};

export function HeroView({
  eyebrow, wordmarkAlt, avatarAlt, heading, claim, subclaim, ctaPrimary, ctaSecondary, scrollHint,
}: HeroViewProps) {
  return (
    <section id="hero" className="relative overflow-hidden px-[var(--gutter)] pb-16 pt-6">
      {/* Si sovrappone alla lettera toccata invece di sostituire le <img>: eredita
          la parallasse e lascia intatto l'elemento LCP. */}
      <CrumpledPaper />

      <HeroMotion>
        <p className="eyebrow">{eyebrow}</p>

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
            {/* Alzato perche' la testa esca dal cerchio; in percentuale perche' il
                cerchio cambia misura fra telefono e desktop. Transform e non
                margine: la parallasse lavora sul genitore, e non si pestano i piedi. */}
            <Avatar alt={avatarAlt} className="relative z-10 w-[88%] -translate-y-[16%]" />
          </InkCircle>
        </div>

        {/* Centrato a ogni larghezza: l'avatar segna l'asse, e il testo a sinistra
            sotto un avatar centrato lasciava l'apertura storta. */}
        <div data-hero-copy className="mt-6 max-w-2xl mx-auto text-center">
          {/* data-hero-claim e' l'elemento LCP: l'entrata non deve portarlo a
              opacita' zero (HeroMotion). 48px e non 52: a 52 la frase va a tre righe
              e spinge i bottoni sotto la piega a 900px. Niente `font-bold`: Archivo
              Black ha un peso solo, e il browser ingrasserebbe le lettere. */}
          <p
            data-hero-claim
            className="display text-balance text-[2rem] leading-[1.1] text-[var(--fg)] lg:text-[3rem]"
          >
            {claim}
          </p>
          {/* text-balance: senza, "e-commerce" si spezzava dopo il trattino. Non col
              trattino unificatore: la parola non corrisponderebbe piu' a come la si
              cerca. Colonna stretta: oltre ~75 battute l'occhio perde la riga dopo. */}
          <p className="mt-3 max-w-xl text-balance text-[var(--fg-muted)] mx-auto">
            {subclaim}
          </p>

          {/* L'anello arancione sta su «Parliamone», l'azione suggerita, e passa
              all'altro bottone al passaggio (sections/hero.css, [data-hero-cta]). */}
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

        {/* Dentro HeroMotion e non dopo: fuori comparivano subito, e invitavano a
            scorrere una pagina che non aveva finito di apparire. */}
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
