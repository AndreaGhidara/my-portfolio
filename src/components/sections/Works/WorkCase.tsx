"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { gsap } from "@/animations/gsap";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

export type WorkMetric = { id: string; value: string; label: string };

export type WorkCaseData = {
  id: string;
  name: string;
  symptom: string;
  decision: string;
  outcome: string;
  url: string;
  screenshot: string;
  year: number;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  symptom: string;
  decision: string;
  outcome: string;
  visit: string;
  open: string;
  close: string;
};

/**
 * SI APRE — la terza famiglia di animazioni. La cartella ruota sull'aletta
 * e il contenuto esce da dentro. Il `rotateX` è riservato al livello
 * "full": su mobile il pannello si limita a comparire.
 * Il contenuto chiuso non è nel DOM: così chi scorre non ci inciampa con
 * la tastiera e la pagina resta leggera.
 */
export function WorkCase({
  data,
  labels,
  index,
}: {
  data: WorkCaseData;
  labels: WorkCaseLabels;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const scope = useRef<HTMLElement | null>(null);

  useSectionAnimation((level) => {
    const panel = scope.current?.querySelector("[data-work-panel]");
    if (!panel || !open) return;

    gsap.from(panel, {
      opacity: 0,
      y: 12,
      rotateX: level === "full" ? -8 : 0,
      transformOrigin: "top center",
      duration: level === "full" ? 0.55 : 0.35,
    });
    // `open` fra le dipendenze: senza, l'apertura non verrebbe mai animata,
    // perche' l'hook si riesegue solo al cambio di livello di movimento.
  }, scope, [open]);

  return (
    <article ref={scope} className="border-t border-[var(--line)] py-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-4 text-left"
      >
        <span className="eyebrow pt-1">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex-1">
          {/* Il sintomo per primo: il cliente si riconosce nel problema
              prima di sapere di che azienda si tratta. */}
          <span className="block text-lg font-semibold text-[var(--fg)] lg:text-xl">
            {data.symptom}
          </span>
          <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            {data.name} · {data.year}
          </span>
        </span>
        <span aria-hidden="true" className="pt-1 text-[var(--accent)]">
          {open ? "−" : "+"}
        </span>
        <span className="sr-only">{open ? labels.close : labels.open}</span>
      </button>

      {open && (
        <div id={panelId} data-work-panel className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="eyebrow">{labels.decision}</p>
              <p className="mt-2 leading-relaxed text-[var(--fg)]">{data.decision}</p>
            </div>
            <div>
              <p className="eyebrow">{labels.outcome}</p>
              <p className="mt-2 leading-relaxed text-[var(--fg-muted)]">{data.outcome}</p>
            </div>

            {data.metrics.length > 0 && (
              <dl className="flex flex-wrap gap-6">
                {data.metrics.map((metric) => (
                  <div key={metric.id}>
                    <dd>
                      <span className="block text-3xl font-black leading-none text-[var(--fg)]">
                        {metric.value}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--fg-muted)]">
                        {metric.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-wrap items-center gap-3">
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
                  <li key={item} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--fg-muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Image
            src={data.screenshot}
            alt={`${data.name}: schermata del progetto`}
            width={1200}
            height={750}
            className="h-auto w-full rounded-[var(--radius)] border border-[var(--line)]"
          />
        </div>
      )}
    </article>
  );
}
