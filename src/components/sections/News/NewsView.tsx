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

export function NewsView({ eyebrow, title, intro, locale, copy }: NewsViewProps) {
  return (
    <section
      id="notizie"
      aria-labelledby="news-title"
      data-news
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <Reveal data-news-head motion="behind" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="news-title" className="section-title">
          {title}
        </h2>
        <p>{intro}</p>
      </Reveal>
      <NewsStand copy={copy} locale={locale} />
    </section>
  );
}
