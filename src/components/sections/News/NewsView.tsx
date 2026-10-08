import { Reveal } from "@/animations/components/Reveal";
import { NewsStand } from "./NewsStand";
import type { NewsCopy } from "./types";

export type NewsViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  locale: string;
  copy: NewsCopy;
};

/**
 * Le notizie della settimana, prima dei Contatti: un distributore di palline
 * con tre pulsanti, I.A., Design e Codice, e accanto la prima pagina di un
 * giornale. I prototipi sono docs/prototipi/2026-09-28-bancone-tre-pulsanti.html,
 * variante A (la macchina), e docs/prototipi/2026-09-29-notizie-impaginate.html,
 * variante B (il foglio).
 */
export function NewsView({ eyebrow, title, intro, locale, copy: testi }: NewsViewProps) {
  return (
    <section
      id="notizie"
      aria-labelledby="titolo-notizie"
      data-notizie
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <Reveal data-notizie-testa motion="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="titolo-notizie" className="titolo-sezione">
          {title}
        </h2>
        <p>{intro}</p>
      </Reveal>
      <NewsStand copy={testi} locale={locale} />
    </section>
  );
}
