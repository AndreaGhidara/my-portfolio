"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import type { WorkCaseData, WorkCaseLabels } from "./types";

export type WorkDialogProps = {
  data: WorkCaseData | null;
  origin: DOMRect | null;
  labels: WorkCaseLabels;
  onClose: () => void;
};

/**
 * Il dossier aperto.
 *
 * E' un <dialog> nativo aperto con showModal(): la trappola del focus,
 * l'Escape, lo sfondo, lo strato superiore e il ritorno del focus sulla
 * cartella che l'ha aperto li fa il browser. Rifarli a mano e' il modo
 * classico per ritrovarsi con una trappola di focus rotta che nessuno prova.
 *
 * L'apertura cresce dal rettangolo della cartella cliccata, cosi' il dossier
 * sembra uscire da quella cartella li' e non comparire dal nulla.
 */
export function WorkDialog({ data, origin, labels, onClose }: WorkDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!data) {
      if (dialog.open) dialog.close();
      return;
    }

    dialog.showModal();
    // showModal() non blocca lo scroll della pagina sotto: senza questo, la
    // rotellina scorre il sito dietro al dossier.
    document.documentElement.setAttribute("data-dialog-open", "");

    if (origin && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = dialog.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
      const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);
      // Scala uniforme e non due fattori diversi: scalando larghezza e altezza
      // in modo indipendente il testo si deforma in modo visibile. Si prende il
      // rapporto piu' piccolo cosi' la partenza e' davvero piccola anche da
      // telefono, dove la cartella e' larga quasi quanto lo schermo.
      const scale = Math.max(
        0.15,
        Math.min(origin.width / target.width, origin.height / target.height),
      );

      dialog.animate(
        [
          // L'inclinazione e' l'apertura: il dossier parte dalla cartella,
          // ribaltato come un coperchio, e si spiana venendo verso di te.
          {
            transform: `perspective(1600px) translate(${dx}px, ${dy}px) scale(${scale}) rotateX(-16deg)`,
            opacity: 0,
            offset: 0,
          },
          { opacity: 1, offset: 0.28 },
          { transform: "perspective(1600px) translate(0px, 0px) scale(1) rotateX(0deg)", opacity: 1, offset: 1 },
        ],
        { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }

    return () => {
      document.documentElement.removeAttribute("data-dialog-open");
    };
  }, [data, origin]);

  return (
    <dialog
      ref={dialogRef}
      data-work-dialog
      aria-labelledby={titleId}
      onClose={onClose}
      // Un click che finisce sull'elemento <dialog> stesso, e non su un suo
      // figlio, e' un click sullo sfondo.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      {data && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-[var(--line)] px-[var(--gutter)] py-4">
            <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
            <p id={titleId} className="eyebrow">
              {data.name} · {data.year}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="-mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--fg)]"
            >
              <span aria-hidden="true" className="text-lg leading-none">×</span>
              <span className="sr-only">{labels.close}</span>
            </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--gutter)] py-6 lg:py-10">
            <div className="mx-auto w-full max-w-5xl">
            <Image
              src={data.screenshot}
              alt={`${data.name}: schermata del progetto`}
              width={1200}
              height={750}
              sizes="(min-width: 1024px) 60rem, 100vw"
              // Tetto all'altezza: a piena proporzione lo screenshot si mangia
              // tutto il dossier e le metriche finiscono sotto la piega. Si
              // taglia dal basso, perche' la testata del sito e' la parte che
              // lo fa riconoscere.
              className="max-h-[34vh] w-full rounded-[var(--radius)] border border-[var(--line)] object-cover object-top"
            />

            <div className="mt-7 grid gap-6 lg:grid-cols-3">
              <div>
                <p className="eyebrow">{labels.symptom}</p>
                <p className="mt-2 leading-relaxed text-[var(--fg)]">{data.symptom}</p>
              </div>
              <div>
                <p className="eyebrow">{labels.decision}</p>
                <p className="mt-2 leading-relaxed text-[var(--fg)]">{data.decision}</p>
              </div>
              <div>
                <p className="eyebrow">{labels.outcome}</p>
                <p className="mt-2 leading-relaxed text-[var(--fg-muted)]">{data.outcome}</p>
              </div>
            </div>

            {data.metrics.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-8 border-t border-[var(--line)] pt-6">
                {data.metrics.map((metric) => (
                  // flex-col-reverse: nel DOM l'ordine resta dt -> dd, come richiede
                  // la specifica; a schermo il numero appare sopra la sua etichetta.
                  <div key={metric.id} className="flex flex-col-reverse gap-1">
                    <dt className="text-xs text-[var(--fg-muted)]">{metric.label}</dt>
                    <dd className="text-3xl font-black leading-none text-[var(--fg)] lg:text-4xl">
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-6">
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[var(--fg)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--fg)]"
              >
                {labels.visit}
              </a>
              <ul className="flex flex-wrap gap-2">
                {data.tech.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--fg-muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
