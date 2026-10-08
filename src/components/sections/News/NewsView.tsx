import { Reveal } from "@/animations/components/Reveal";
import { Bancone } from "./NewsStand";
import type { TestiNotizie } from "./types";

export type NotizieViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  locale: string;
  testi: TestiNotizie;
};

/**
 * Le notizie della settimana, prima dei Contatti: un distributore di palline
 * con tre pulsanti, I.A., Design e Codice, e accanto la prima pagina di un
 * giornale. I prototipi sono docs/prototipi/2026-09-28-bancone-tre-pulsanti.html,
 * variante A (la macchina), e docs/prototipi/2026-09-29-notizie-impaginate.html,
 * variante B (il foglio).
 */
export function NotizieView({ eyebrow, title, intro, locale, testi }: NotizieViewProps) {
  return (
    <section
      id="notizie"
      aria-labelledby="titolo-notizie"
      data-notizie
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <Reveal data-notizie-testa moto="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="titolo-notizie" className="titolo-sezione">
          {title}
        </h2>
        <p>{intro}</p>
      </Reveal>
      <Bancone testi={testi} locale={locale} />
    </section>
  );
}
