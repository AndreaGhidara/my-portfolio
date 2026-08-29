"use client";

import type { WorkCaseData } from "./types";

/**
 * Una cartella dello schedario, chiusa.
 *
 * La linguetta porta il nome del cliente, la faccia porta il sintomo: chi
 * arriva da cliente si riconosce nel problema prima di sapere di che azienda
 * si tratta, ed e' il motivo per cui il nome non e' il titolo.
 *
 * Il sintomo resta leggibile anche da telefono, dove nessuno passa il mouse:
 * una pila di sole linguette costringerebbe a un tap per sapere di cosa si
 * parla, e meta' di chi apre il sito lo apre da mobile.
 */
export function WorkFolder({
  data,
  index,
  openLabel,
  onOpen,
}: {
  data: WorkCaseData;
  index: number;
  openLabel: string;
  onOpen: (data: WorkCaseData, origin: DOMRect) => void;
}) {
  return (
    <button
      type="button"
      data-work-folder
      aria-haspopup="dialog"
      onClick={(event) => onOpen(data, event.currentTarget.getBoundingClientRect())}
      style={{ zIndex: index }}
      className="group flex w-full flex-col items-start text-left focus-visible:outline-none"
    >
      {/* La linguetta copre di un pixel il bordo alto del corpo e non ha bordo
          inferiore: e' quello che salda le due forme in una cartella sola. */}
      <span className="relative z-10 -mb-px rounded-t-[10px] border border-b-0 border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
        {data.name} · {data.year}
      </span>

      <span data-folder-body className="flex w-full flex-1 flex-col rounded-b-[var(--radius)] rounded-tr-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent)] lg:p-5">
        <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
        <span className="mt-3 block flex-1 text-[0.95rem] font-semibold leading-snug text-[var(--fg)] lg:text-base">
          {data.symptom}
        </span>
        <span
          aria-hidden="true"
          className="mt-4 self-end text-lg leading-none text-[var(--accent)]"
        >
          +
        </span>
      </span>

      <span className="sr-only">{openLabel}</span>
    </button>
  );
}
