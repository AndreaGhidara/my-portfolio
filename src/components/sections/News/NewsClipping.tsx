import type { CSSProperties } from "react";
import type { CategoriaId, Dato, Notizia } from "@/lib/news/types";
import { nomeFonte, quantoFa, riempi, titoloDi } from "./format";
import type { TestiNotizie } from "./types";

/**
 * La notizia grande della prima pagina: la fonte, il timbro, il titolo, il
 * riassunto e i numeri. La testata e la data stanno sopra, sul foglio. La
 * misura la decide il foglio, qualunque notizia esca: il titolo si ferma a tre
 * righe, il riassunto a un numero fisso di righe coi puntini, e senza riassunto
 * il suo posto resta (il dominio in grande e una riga). Dati e link sul fondo.
 * Carta in tutti e due i temi, come la pratica dei lavori. Niente immagini: la
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
  const titolo = titoloDi(notizia, testi);

  return (
    <article data-notizie-ritaglio data-cat={cat} style={{ "--storto": `${storto}deg` } as CSSProperties}>
      <div data-ritaglio-sotto data-ritaglio-riga>
        <span>
          {nomeFonte(notizia.fonte)} · {quantoFa(notizia.quando, locale, adesso)}
        </span>
        <span data-ritaglio-timbro>{testi.timbri[notizia.timbro]}</span>
      </div>
      {/* La notizia resta nella sua lingua, che e' l'inglese. Il titolo di una
          release no: «e' uscito» lo scrive la pagina, nella sua. */}
      <h3 lang={notizia.timbro === "release" ? undefined : "en"}>{titolo}</h3>
      <div data-ritaglio-corpo>
        {notizia.riassunto ? (
          <p data-ritaglio-riassunto lang="en">
            {notizia.riassunto}
          </p>
        ) : (
          <div data-ritaglio-vuoto>
            <b>{notizia.hostname}</b>
            <span>{testi.senzaRiassunto}</span>
          </div>
        )}
      </div>
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
