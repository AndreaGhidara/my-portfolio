"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MotionLevel } from "@/animations/motionPolicy";
import { ZONES, type Garment, type ZoneId } from "@/content/toolbox";
import { configLines, zoneLines, type CodeLine } from "./code";
import { NodeLabel } from "./NodeLabel";
import { toolById, sortedWeights } from "./graph";
import type { ToolboxStep, ToolboxCopy } from "./types";

// Millisecondi per riga: un file intero in poco piu' di un secondo.
const LINE_INTERVAL = 70;

type OpenFile = { kind: "config" } | { kind: "zone"; zone: ZoneId };

// La cassetta sul telefono, e sul computer sotto i 1280px o senza mouse.
// Altezza fissa e codice che scorre dentro: scegliere un lavoro non sposta la
// pagina.
export function Editor({
  copy,
  garment,
  step,
  sheetOpen,
  canGoBack,
  onOpen,
  onNode,
  onGarment,
  onBack,
  onClose,
  level,
  active,
}: {
  copy: ToolboxCopy;
  garment: Garment | null;
  step: ToolboxStep;
  sheetOpen: boolean;
  canGoBack: boolean;
  onOpen: (id: string) => void;
  onNode: (id: string) => void;
  onGarment: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
  level: MotionLevel;
  active: boolean;
}) {
  const e = copy.editor;
  const [opened, setOpened] = useState<OpenFile>({ kind: "config" });
  const [visible, setVisible] = useState(Number.POSITIVE_INFINITY);
  const code = useRef<HTMLDivElement | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const fileButton = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const lines: CodeLine[] = useMemo(
    () =>
      opened.kind === "config"
        ? configLines(garment, copy)
        : zoneLines(opened.zone, garment, copy),
    [opened, garment, copy],
  );

  // In fase di layout, o il file nuovo si vedrebbe intero per un fotogramma
  // prima di sparire e ricominciare a scriversi.
  const firstRun = useRef(true);
  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setOpened({ kind: "config" });
    if (!garment || level === "none" || !active) {
      setVisible(Number.POSITIVE_INFINITY);
      return;
    }
    setVisible(0);
  }, [garment, level, active]);

  useEffect(() => {
    if (visible >= lines.length) return;
    const id = window.setTimeout(() => setVisible((v) => v + 1), LINE_INTERVAL);
    return () => window.clearTimeout(id);
  }, [visible, lines.length]);

  // L'ultima riga nuova resta in vista. Scorre la finestra, mai la pagina.
  useEffect(() => {
    const el = code.current;
    if (el && visible < lines.length) el.scrollTop = el.scrollHeight;
  }, [visible, lines.length]);

  const openFile = (next: OpenFile) => {
    setOpened(next);
    setVisible(Number.POSITIVE_INFINITY);
    if (code.current) code.current.scrollTop = 0;
  };

  /* Il foglio e' un <dialog> nativo aperto con showModal(), come il dossier
     dei Lavori: trappola del fuoco, Escape, sfondo e ritorno del fuoco li fa il
     browser. html[data-dialog-open] ferma la pagina sotto e nasconde la barra
     in basso, e si toglie anche se il componente se ne va con il foglio aperto. */
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!sheetOpen) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    document.documentElement.setAttribute("data-dialog-open", "");
    return () => {
      document.documentElement.removeAttribute("data-dialog-open");
    };
  }, [sheetOpen]);

  useEffect(() => {
    const d = dialog.current;
    return () => {
      if (d?.open) d.close();
      document.documentElement.removeAttribute("data-dialog-open");
    };
  }, []);

  const title =
    opened.kind === "config"
      ? e.file
      : `${e.folder}/${copy.zones[opened.zone].short}.ts`;
  const written = lines.slice(0, visible);
  const writing = visible < lines.length;

  return (
    <div data-toolbox-view-editor>
      <div
        data-toolbox-editor
        data-garment={garment ? "" : undefined}
        role="group"
        aria-label={e.name}
      >
        <div data-editor-title aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{title}</span>
        </div>

        <div data-editor-tree role="toolbar" aria-label={e.folders}>
          <button
            type="button"
            ref={fileButton}
            data-file
            aria-pressed={opened.kind === "config"}
            onClick={() => openFile({ kind: "config" })}
          >
            {e.file}
          </button>
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              data-zone={z.id}
              data-needed={
                (garment && garment.uses.some((id) => toolById(id)?.zone === z.id)) ||
                undefined
              }
              aria-pressed={opened.kind === "zone" && opened.zone === z.id}
              onClick={() => openFile({ kind: "zone", zone: z.id })}
            >
              {copy.zones[z.id].short}
            </button>
          ))}
        </div>

        <div ref={code} data-editor-code aria-busy={writing || undefined}>
          {written.map((line, i) => (
            <span
              key={`${opened.kind}-${i}`}
              data-code-line
              data-new={
                (line.isNew && garment && opened.kind === "config") || undefined
              }
            >
              {line.pieces.map((p, k) =>
                p.kind === "a" ? (
                  <button
                    key={k}
                    type="button"
                    data-syntax="s"
                    data-tool
                    onClick={() => onOpen(p.id)}
                  >
                    {p.text}
                  </button>
                ) : (
                  <span key={k} data-syntax={p.kind}>
                    {p.text}
                  </span>
                ),
              )}
            </span>
          ))}
        </div>

        <div data-editor-state>
          <span>✓ {garment ? copy.garments[garment.id].status : e.zeroErrors}</span>
          <span data-editor-mix aria-hidden="true">
            {garment &&
              sortedWeights(garment).map(([z, pc]) => (
                <i key={z} data-zone={z} style={{ width: `${pc}%` }} />
              ))}
          </span>
          <span aria-hidden="true">TS</span>
        </div>
      </div>

      <dialog
        ref={dialog}
        data-toolbox-sheet
        aria-labelledby={titleId}
        onClose={() => {
          onClose();
          // Scelto un capo dentro il foglio, il file si e' riscritto e il nome
          // che l'aveva aperto non c'e' piu': il browser rimetterebbe il fuoco
          // sul body. Si torna al file del sito, che c'e' sempre.
          const focused = document.activeElement;
          if (!focused || focused === document.body) fileButton.current?.focus();
        }}
        onClick={(ev) => {
          if (ev.target === dialog.current) dialog.current?.close();
        }}
      >
        {sheetOpen && (
          <NodeLabel
            key={`${step.kind}-${step.id}`}
            step={step}
            copy={copy}
            onNode={onNode}
            onGarment={onGarment}
            titleId={titleId}
            toolsOnly
            actions={
              <>
                <button
                  type="button"
                  onClick={onBack}
                  hidden={!canGoBack}
                >
                  <span aria-hidden="true">‹ </span>
                  {copy.label.back}
                </button>
                <button
                  type="button"
                  data-label-close
                  onClick={() => dialog.current?.close()}
                >
                  {copy.label.close}
                  <span aria-hidden="true"> ✕</span>
                </button>
              </>
            }
          />
        )}
      </dialog>
    </div>
  );
}
