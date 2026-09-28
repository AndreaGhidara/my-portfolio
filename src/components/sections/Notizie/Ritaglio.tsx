import type { CSSProperties } from "react";
import type { CategoriaId, Dato, Notizia } from "@/lib/notizie/tipi";
import { nomeFonte, quantoFa, riempi, titoloDi } from "./formato";
import type { TestiNotizie } from "./tipi";

/** Sotto questa lunghezza un riassunto su due colonne lascia una parola sola nella seconda. */
const DUE_COLONNE = 240;

/**
 * Il ritaglio di giornale: la testata della categoria, la data di oggi, la
 * fonte, il timbro, il titolo, il riassunto su due colonne e i numeri. Carta
 * in tutti e due i temi, come la pratica dei lavori. Niente immagini: la
 * pagina non apre connessioni verso terzi, e il link si apre solo se lo premi.
 */
export function Ritaglio({
  notizia,
  cat,
  storto,
  testi,
  locale,
  adesso,
}: {
  notizia: Notizia;
  cat: CategoriaId;
  /** Di quanto e' storto, in gradi: lo sceglie chi l'ha stampato. */
  storto: number;
  testi: TestiNotizie;
  locale: string;
  adesso: Date;
}) {
  const numero = new Intl.NumberFormat(locale);
  const valore = (d: Dato) =>
    d.codice === "versione"
      ? d.valore
      : d.codice === "lettura"
        ? riempi(testi.minuti, { n: numero.format(d.valore) })
        : numero.format(d.valore);
  const oggi = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(adesso);
  const titolo = titoloDi(notizia, testi);

  return (
    <article data-notizie-ritaglio data-cat={cat} style={{ "--storto": `${storto}deg` } as CSSProperties}>
      <div data-ritaglio-testata>
        <b>
          <i aria-hidden="true" />
          {testi.categorie[cat].testata}
        </b>
        <span data-ritaglio-riga>{oggi}</span>
      </div>
      <div data-ritaglio-sotto data-ritaglio-riga>
        <span>
          {nomeFonte(notizia.fonte)} · {quantoFa(notizia.quando, locale, adesso)}
        </span>
        <span data-ritaglio-timbro>{testi.timbri[notizia.timbro]}</span>
      </div>
      {/* La notizia resta nella sua lingua, che e' l'inglese. Il titolo di una
          release no: «e' uscito» lo scrive la pagina, nella sua. */}
      <h3 lang={notizia.timbro === "release" ? undefined : "en"}>{titolo}</h3>
      {notizia.riassunto ? (
        <p data-ritaglio-riassunto data-colonne={notizia.riassunto.length > DUE_COLONNE ? "2" : "1"} lang="en">
          {notizia.riassunto}
        </p>
      ) : null}
      <div data-ritaglio-piede>
        <p data-ritaglio-dati>
          {notizia.dati.map((d) => (
            <span key={d.codice}>
              <b>{valore(d)}</b> {testi.dati[d.codice]}
            </span>
          ))}
        </p>
        <a href={notizia.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
          {riempi(testi.leggiSu, { sito: notizia.hostname })} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
