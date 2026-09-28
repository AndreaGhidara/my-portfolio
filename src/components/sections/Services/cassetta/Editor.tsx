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
import { ZONE, type Capo, type ZonaId } from "@/content/cassetta";
import { righeConfig, righeZona, type Riga } from "./codice";
import { Etichetta } from "./Etichetta";
import { attrezzo, pesiOrdinati } from "./grafo";
import type { Passo, TestiCassetta } from "./tipi";

/** Il ritmo a cui il file si riscrive, riga dopo riga. */
const PASSO_RIGA = 70;

type Aperto = { tipo: "config" } | { tipo: "zona"; zona: ZonaId };

/**
 * La cassetta sul telefono, e sul computer sotto i 1280px o senza mouse: una
 * finestra di codice. In alto le cartelle degli scomparti, aperto il file del
 * tuo sito; scelto un lavoro il file si riscrive da solo, riga per riga, e la
 * barra di stato in fondo mostra la composizione. Ogni nome tra virgolette si
 * tocca e apre l'etichetta, che sale dal basso.
 *
 * La finestra e' scura in tutti e due i temi, perche' e' un editor. L'altezza e'
 * fissa e il codice scorre dentro: scegliere un lavoro non sposta la pagina.
 */
export function Editor({
  testi,
  capo,
  passo,
  foglioAperto,
  puoIndietro,
  onApri,
  onNodo,
  onCapo,
  onIndietro,
  onChiudi,
  level,
  attiva,
}: {
  testi: TestiCassetta;
  capo: Capo | null;
  passo: Passo;
  foglioAperto: boolean;
  puoIndietro: boolean;
  onApri: (id: string) => void;
  onNodo: (id: string) => void;
  onCapo: (id: string) => void;
  onIndietro: () => void;
  onChiudi: () => void;
  level: MotionLevel;
  attiva: boolean;
}) {
  const e = testi.editor;
  const [aperto, setAperto] = useState<Aperto>({ tipo: "config" });
  const [visibili, setVisibili] = useState(Number.POSITIVE_INFINITY);
  const codice = useRef<HTMLDivElement | null>(null);
  const dialogo = useRef<HTMLDialogElement | null>(null);
  const tastoFile = useRef<HTMLButtonElement | null>(null);
  const titoloId = useId();

  const righe: Riga[] = useMemo(
    () =>
      aperto.tipo === "config"
        ? righeConfig(capo, testi)
        : righeZona(aperto.zona, capo, testi),
    [aperto, capo, testi],
  );

  /* Un lavoro nuovo riapre il file del sito e lo riscrive. A "none" e' gia'
     scritto; altrove una riga ogni 70ms, cioe' un file intero in poco piu' di
     un secondo. In fase di layout, o il file nuovo si vedrebbe intero per un
     fotogramma prima di sparire e ricominciare. */
  const primoGiro = useRef(true);
  useLayoutEffect(() => {
    if (primoGiro.current) {
      primoGiro.current = false;
      return;
    }
    setAperto({ tipo: "config" });
    if (!capo || level === "none" || !attiva) {
      setVisibili(Number.POSITIVE_INFINITY);
      return;
    }
    setVisibili(0);
  }, [capo, level, attiva]);

  useEffect(() => {
    if (visibili >= righe.length) return;
    const id = window.setTimeout(() => setVisibili((v) => v + 1), PASSO_RIGA);
    return () => window.clearTimeout(id);
  }, [visibili, righe.length]);

  // Il codice scorre con la scrittura, come in un editor vero: l'ultima riga
  // nuova resta in vista. Solo dentro la finestra, mai la pagina.
  useEffect(() => {
    const el = codice.current;
    if (el && visibili < righe.length) el.scrollTop = el.scrollHeight;
  }, [visibili, righe.length]);

  const apri = (nuovo: Aperto) => {
    setAperto(nuovo);
    setVisibili(Number.POSITIVE_INFINITY);
    if (codice.current) codice.current.scrollTop = 0;
  };

  /* Il foglio e' un <dialog> nativo aperto con showModal(), come il dossier
     dei Lavori: trappola del fuoco, Escape, sfondo e ritorno del fuoco li fa il
     browser. html[data-dialog-open] ferma la pagina sotto e nasconde la barra
     in basso, e si toglie anche se il componente se ne va con il foglio aperto. */
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (!foglioAperto) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    document.documentElement.setAttribute("data-dialog-open", "");
    return () => {
      document.documentElement.removeAttribute("data-dialog-open");
    };
  }, [foglioAperto]);

  useEffect(() => {
    const d = dialogo.current;
    return () => {
      if (d?.open) d.close();
      document.documentElement.removeAttribute("data-dialog-open");
    };
  }, []);

  const titolo =
    aperto.tipo === "config"
      ? e.file
      : `${e.cartella}/${testi.zone[aperto.zona].corto}.ts`;
  const scritte = righe.slice(0, visibili);
  const scrivendo = visibili < righe.length;

  return (
    <div data-cassetta-vista-editor>
      <div
        data-cassetta-editor
        data-capo={capo ? "" : undefined}
        role="group"
        aria-label={e.nome}
      >
        <div data-editor-titolo aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{titolo}</span>
        </div>

        <div data-editor-albero role="toolbar" aria-label={e.cartelle}>
          <button
            type="button"
            ref={tastoFile}
            data-file
            aria-pressed={aperto.tipo === "config"}
            onClick={() => apri({ tipo: "config" })}
          >
            {e.file}
          </button>
          {ZONE.map((z) => (
            <button
              key={z.id}
              type="button"
              data-zona={z.id}
              data-serve={
                (capo && capo.usa.some((id) => attrezzo(id)?.zona === z.id)) ||
                undefined
              }
              aria-pressed={aperto.tipo === "zona" && aperto.zona === z.id}
              onClick={() => apri({ tipo: "zona", zona: z.id })}
            >
              {testi.zone[z.id].corto}
            </button>
          ))}
        </div>

        <div ref={codice} data-editor-codice aria-busy={scrivendo || undefined}>
          {scritte.map((riga, i) => (
            <span
              key={`${aperto.tipo}-${i}`}
              data-codice-riga
              data-nuova={
                (riga.nuova && capo && aperto.tipo === "config") || undefined
              }
            >
              {riga.pezzi.map((p, k) =>
                p.tipo === "a" ? (
                  <button
                    key={k}
                    type="button"
                    data-sintassi="s"
                    data-attrezzo
                    onClick={() => onApri(p.id)}
                  >
                    {p.testo}
                  </button>
                ) : (
                  <span key={k} data-sintassi={p.tipo}>
                    {p.testo}
                  </span>
                ),
              )}
            </span>
          ))}
        </div>

        <div data-editor-stato>
          <span>✓ {capo ? testi.capi[capo.id].stato : e.zeroErrori}</span>
          <span data-editor-mix aria-hidden="true">
            {capo &&
              pesiOrdinati(capo).map(([z, pc]) => (
                <i key={z} data-zona={z} style={{ width: `${pc}%` }} />
              ))}
          </span>
          <span aria-hidden="true">TS</span>
        </div>
      </div>

      <dialog
        ref={dialogo}
        data-cassetta-foglio
        aria-labelledby={titoloId}
        onClose={() => {
          onChiudi();
          // Scelto un capo dentro il foglio, il file si e' riscritto e il nome
          // che l'aveva aperto non c'e' piu': il browser rimetterebbe il fuoco
          // sul body. Si torna al file del sito, che c'e' sempre.
          const fuoco = document.activeElement;
          if (!fuoco || fuoco === document.body) tastoFile.current?.focus();
        }}
        onClick={(ev) => {
          if (ev.target === dialogo.current) dialogo.current?.close();
        }}
      >
        {foglioAperto && (
          <Etichetta
            key={`${passo.tipo}-${passo.id}`}
            passo={passo}
            testi={testi}
            onNodo={onNodo}
            onCapo={onCapo}
            titoloId={titoloId}
            soloAttrezzi
            azioni={
              <>
                <button
                  type="button"
                  onClick={onIndietro}
                  hidden={!puoIndietro}
                >
                  <span aria-hidden="true">‹ </span>
                  {testi.etichetta.indietro}
                </button>
                <button
                  type="button"
                  data-etichetta-chiudi
                  onClick={() => dialogo.current?.close()}
                >
                  {testi.etichetta.chiudi}
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
