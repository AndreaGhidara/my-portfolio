"use client";

import { useId, type RefObject } from "react";
import { site } from "@/content/site";
import { pad2 } from "@/lib/format";
import { WorkShot } from "./WorkShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";

export type WorkDialogProps = {
  dialog: RefObject<HTMLDialogElement | null>;
  data: WorkCaseData | null;
  number: number;
  total: number;
  labels: WorkCaseLabels;
  /** ×, Esc e clic sul velo: la chiusura la anima useDossier. */
  onRequestClose: () => void;
  /** Il dialog si e' chiuso, orchestrato o no. */
  onClose: () => void;
};

const domain = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** Aprirlo e chiuderlo lo fa useDossier, perche' in mezzo c'e' la cartella che
 *  scivola via: per questo l'Esc si ferma qui e diventa una richiesta di
 *  chiusura. Il foglio e' carta nei due temi: niente di quello che si ribalta
 *  col tema entra qui, .eyebrow compreso (vedi sections/works.css). */
export function WorkDialog({ dialog, data, number, total, labels, onRequestClose, onClose }: WorkDialogProps) {
  const titleId = useId();
  const statusLabel = data?.status === "in-progress" ? labels.inProgress : labels.delivered;

  return (
    <dialog
      ref={dialog}
      data-work-dialog
      // Lenis da fermo annulla ogni rotella che non trova questo attributo: il
      // foglio, che scorre dentro di se', restava col fondo irraggiungibile.
      data-lenis-prevent
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClose={onClose}
      // Il dialog e' un piano trasparente grande quanto lo schermo: un clic
      // che finisce su di lui, e non su un suo figlio, e' un clic sul velo.
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose();
      }}
    >
      {data && (
        <>
          <button type="button" data-dossier-close data-enter onClick={onRequestClose}>
            <span aria-hidden="true">×</span>
            <span className="sr-only">{labels.close}</span>
          </button>

          <article data-dossier>
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
                    {pad2(number)} / {pad2(total)}
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
                  <dd>{statusLabel}</dd>
                </div>
                <div>
                  <dt>{labels.online}</dt>
                  <dd>{data.url ? domain(data.url) : labels.confidential}</dd>
                </div>
              </dl>

              <div data-dossier-body>
                <div data-dossier-subject data-enter>
                  <p>{labels.before}</p>
                  <p>{data.tagline}</p>
                </div>

                <div data-dossier-right>
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
                      <h3>{data.status === "in-progress" ? labels.measuredSoFar : labels.measured}</h3>
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

              <ol data-dossier-items>
                {(
                  [
                    [labels.work, data.work],
                    [labels.choice, data.choice],
                    [labels.approach, data.approach],
                  ] as const
                ).map(([title, text], n) => (
                  <li key={title} data-enter>
                    <span aria-hidden="true">{n + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <footer data-dossier-foot data-enter>
                <div data-dossier-foot-left>
                  <ul data-dossier-tech>
                    {data.tech.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {data.url ? (
                    <a data-dossier-link href={data.url} target="_blank" rel="noopener noreferrer">
                      {labels.visit} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span data-dossier-no-link>{labels.confidential}</span>
                  )}
                </div>
                <p data-dossier-stamp>{statusLabel}</p>
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
