"use client";

import { useId, type RefObject } from "react";
import { site } from "@/content/site";
import { pad2 } from "@/lib/format";
import { WorkShot } from "./WorkShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";

export type WorkDialogProps = {
  dialog: RefObject<HTMLDialogElement | null>;
  data: WorkCaseData | null;
  /** Il posto della cartella nell'archivio, da uno. */
  number: number;
  total: number;
  labels: WorkCaseLabels;
  /** ×, Esc e clic sul velo: la chiusura la anima usePratica. */
  onRequestClose: () => void;
  /** Il dialog si e' chiuso, orchestrato o no. */
  onClose: () => void;
};

/** Il dominio dell'indirizzo, senza protocollo e senza www: come si dice a voce. */
const dominio = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/**
 * La pratica: il dossier aperto, un foglio di carta sopra la pagina velata.
 *
 * E' un <dialog> nativo aperto con showModal(): trappola del fuoco, strato
 * superiore e pagina inerte li fa il browser. Aprirlo e chiuderlo no: lo fa
 * usePratica, perche' in mezzo c'e' la cartella che scivola via (scivola.ts).
 * Per questo l'Esc si ferma qui e diventa una richiesta di chiusura, come il
 * × e il clic sul velo. Il contenuto c'e' da subito: l'entrata e' solo
 * opacita' e spostamento, mai un montaggio ritardato.
 *
 * Il foglio e' carta in tutti e due i temi, come l'editor della cassetta e'
 * scuro in tutti e due: e' un oggetto, non la pagina. I suoi colori sono suoi
 * (vedi sezioni/lavori.css), e niente di quello che si ribalta col tema entra qui,
 * .eyebrow compreso.
 */
export function WorkDialog({ dialog: dialogo, data, number: numero, total: totale, labels, onRequestClose: onChiudi, onClose }: WorkDialogProps) {
  const titleId = useId();
  const stato = data?.status === "in-corso" ? labels.inProgress : labels.delivered;

  return (
    <dialog
      ref={dialogo}
      data-work-dialog
      // A dossier aperto Lenis e' fermo, e da fermo annulla ogni rotella che
      // non trova questo attributo: il foglio, che scorre dentro di se' quando
      // non ci sta nello schermo, restava con il fondo irraggiungibile.
      data-lenis-prevent
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onChiudi();
      }}
      onClose={onClose}
      // Il dialog e' un piano trasparente grande quanto lo schermo: un clic
      // che finisce su di lui, e non su un suo figlio, e' un clic sul velo.
      onClick={(event) => {
        if (event.target === event.currentTarget) onChiudi();
      }}
    >
      {data && (
        <>
          <button type="button" data-dossier-close data-enter onClick={onChiudi}>
            <span aria-hidden="true">×</span>
            <span className="sr-only">{labels.close}</span>
          </button>

          <article data-dossier>
            {/* La linguetta e' il titolo: lo stesso della cartella che l'ha aperta. */}
            <p id={titleId} data-dossier-tab>
              <b>{data.name}</b> · {data.year}
            </p>

            <div data-dossier-sheet>
              <header data-dossier-head data-enter>
                <p>
                  <b>{site.name}</b> <span>{labels.archive}</span>
                </p>
                <p data-dossier-number>
                  {labels.dossier}{" "}
                  <strong>
                    {pad2(numero)} / {pad2(totale)}
                  </strong>
                </p>
              </header>

              <dl data-dossier-fields data-enter>
                <div>
                  <dt>{labels.client}</dt>
                  <dd>{data.name}</dd>
                </div>
                <div>
                  <dt>{labels.year}</dt>
                  <dd>{data.year}</dd>
                </div>
                <div>
                  <dt>{labels.status}</dt>
                  <dd>{stato}</dd>
                </div>
                <div>
                  <dt>{labels.online}</dt>
                  <dd>{data.url ? dominio(data.url) : labels.confidential}</dd>
                </div>
              </dl>

              <div data-dossier-body>
                {/* La riga della faccia torna qui come la situazione trovata:
                    e' lei ad aver fatto aprire la pratica. */}
                <div data-dossier-subject data-enter>
                  <p>{labels.before}</p>
                  <p>{data.tagline}</p>
                </div>

                <div data-dossier-right>
                  {/* Senza schermata il posto non resta vuoto: il tratteggio e'
                      il modo in cui questo sito dice «questa cosa non c'e', e
                      non per dimenticanza». */}
                  {data.screenshot ? (
                    <figure data-dossier-attachment data-enter>
                      <div data-dossier-screenshot>
                        <WorkShot shot={data.screenshot} alt={data.screenshotAlt} />
                      </div>
                      <figcaption>{labels.attachment}</figcaption>
                    </figure>
                  ) : (
                    <p data-dossier-confidential data-enter>
                      {labels.confidential}
                    </p>
                  )}

                  {data.metrics.length > 0 && (
                    <section data-dossier-figures data-enter>
                      {/* Un lavoro in corso non ha una fine da cui rilevare. */}
                      <h3>{data.status === "in-corso" ? labels.measuredSoFar : labels.measured}</h3>
                      <dl>
                        {data.metrics.map((metric) => (
                          <div key={metric.id}>
                            <dt>{metric.label}</dt>
                            <dd>
                              <b>{metric.value}</b>
                              {metric.estimated && <small>{labels.estimate}</small>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                </div>
              </div>

              {/* Il lavoro, la scelta, la conduzione: tre pesi uguali apposta.
                  La conduzione e' quello che un elenco di tecnologie non ha, e
                  chi legge in diagonale non deve saltarla. */}
              <ol data-dossier-items>
                {(
                  [
                    [labels.work, data.work],
                    [labels.choice, data.choice],
                    [labels.approach, data.approach],
                  ] as const
                ).map(([titolo, testo], n) => (
                  <li key={titolo} data-enter>
                    <span aria-hidden="true">{n + 1}</span>
                    <div>
                      <h3>{titolo}</h3>
                      <p>{testo}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <footer data-dossier-foot data-enter>
                <div data-dossier-foot-left>
                  <ul data-dossier-tech>
                    {data.tech.map((voce) => (
                      <li key={voce}>{voce}</li>
                    ))}
                  </ul>
                  {/* Senza url il link lascia la sua forma, tratteggiata e non
                      cliccabile: l'assenza si legge come un dato. */}
                  {data.url ? (
                    <a data-dossier-link href={data.url} target="_blank" rel="noopener noreferrer">
                      {labels.visit} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span data-dossier-no-link>{labels.confidential}</span>
                  )}
                </div>
                <p data-dossier-stamp>{stato}</p>
                <p data-dossier-signature>
                  <em>{labels.signatureName}</em>
                  {labels.signatureRole}
                </p>
              </footer>
            </div>
          </article>
        </>
      )}
    </dialog>
  );
}
