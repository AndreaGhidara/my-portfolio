import type { CSSProperties } from "react";
import type { CategoryId, StoryFigure, Story } from "@/lib/news/types";
import { sourceName, timeAgo, fillTemplate, storyTitle } from "./format";
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
  story: notizia,
  cat,
  tilt: storto,
  copy: testi,
  locale,
  now: adesso,
}: {
  story: Story;
  cat: CategoryId;
  /** Di quanto e' storto, in gradi: lo sceglie chi l'ha stampato. */
  tilt: number;
  copy: NewsCopy;
  locale: string;
  now: Date;
}) {
  const numero = new Intl.NumberFormat(locale);
  const valore = (d: StoryFigure) =>
    d.code === "versione"
      ? d.value
      : d.code === "lettura"
        ? fillTemplate(testi.minutes, { n: numero.format(d.value) })
        : numero.format(d.value);
  const titolo = storyTitle(notizia, testi);

  return (
    <article data-notizie-ritaglio data-cat={cat} style={{ "--storto": `${storto}deg` } as CSSProperties}>
      <div data-ritaglio-sotto data-ritaglio-riga>
        <span>
          {sourceName(notizia.source)} · {timeAgo(notizia.when, locale, adesso)}
        </span>
        <span data-ritaglio-timbro>{testi.stamps[notizia.stamp]}</span>
      </div>
      {/* La notizia resta nella sua lingua, che e' l'inglese. Il titolo di una
          release no: «e' uscito» lo scrive la pagina, nella sua. */}
      <h3 lang={notizia.stamp === "release" ? undefined : "en"}>{titolo}</h3>
      <div data-ritaglio-corpo>
        {notizia.summary ? (
          <p data-ritaglio-riassunto lang="en">
            {notizia.summary}
          </p>
        ) : (
          <div data-ritaglio-vuoto>
            <b>{notizia.hostname}</b>
            <span>{testi.noSummary}</span>
          </div>
        )}
      </div>
      <div data-ritaglio-piede>
        <p data-ritaglio-dati>
          {notizia.figures.map((d) => (
            <span key={d.code}>
              <b>{valore(d)}</b> {testi.figures[d.code]}
            </span>
          ))}
        </p>
        <a href={notizia.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
          {fillTemplate(testi.readOn, { sito: notizia.hostname })} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
