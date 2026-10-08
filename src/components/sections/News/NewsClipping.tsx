import type { CSSProperties } from "react";
import type { CategoryId, Story, StoryFigure } from "@/lib/news/types";
import { fillTemplate, sourceName, storyTitle, timeAgo } from "./format";
import type { NewsCopy } from "./types";

/**
 * La notizia grande della prima pagina: la fonte, il timbro, il titolo, il
 * riassunto e i numeri. La testata e la data stanno sopra, sul foglio. La
 * misura la decide il foglio, qualunque notizia esca: il titolo si ferma a tre
 * righe, il riassunto a un numero fisso di righe coi puntini, e senza riassunto
 * il suo posto resta (il dominio in grande e una riga). Dati e link sul fondo.
 * Carta in tutti e due i temi, come la pratica dei lavori. Niente immagini: la
 * pagina non apre connessioni verso terzi, e il link si apre solo se lo premi.
 */
export function NewsClipping({
  story,
  cat,
  tilt,
  copy,
  locale,
  now,
}: {
  story: Story;
  cat: CategoryId;
  /** Di quanto e' storto, in gradi: lo sceglie chi l'ha stampato. */
  tilt: number;
  copy: NewsCopy;
  locale: string;
  now: Date;
}) {
  const numberFormat = new Intl.NumberFormat(locale);
  const figureValue = (d: StoryFigure) =>
    d.code === "versione"
      ? d.value
      : d.code === "lettura"
        ? fillTemplate(copy.minutes, { n: numberFormat.format(d.value) })
        : numberFormat.format(d.value);
  const title = storyTitle(story, copy);

  return (
    <article data-news-clipping data-cat={cat} style={{ "--tilt": `${tilt}deg` } as CSSProperties}>
      <div data-clipping-under data-clipping-line>
        <span>
          {sourceName(story.source)} · {timeAgo(story.when, locale, now)}
        </span>
        <span data-clipping-stamp>{copy.stamps[story.stamp]}</span>
      </div>
      {/* La notizia resta nella sua lingua, che e' l'inglese. Il titolo di una
          release no: «e' uscito» lo scrive la pagina, nella sua. */}
      <h3 lang={story.stamp === "release" ? undefined : "en"}>{title}</h3>
      <div data-clipping-body>
        {story.summary ? (
          <p data-clipping-summary lang="en">
            {story.summary}
          </p>
        ) : (
          <div data-clipping-empty>
            <b>{story.hostname}</b>
            <span>{copy.noSummary}</span>
          </div>
        )}
      </div>
      <div data-clipping-foot>
        <p data-clipping-figures>
          {story.figures.map((d) => (
            <span key={d.code}>
              <b>{figureValue(d)}</b> {copy.figures[d.code]}
            </span>
          ))}
        </p>
        <a href={story.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
          {fillTemplate(copy.readOn, { sito: story.hostname })} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
