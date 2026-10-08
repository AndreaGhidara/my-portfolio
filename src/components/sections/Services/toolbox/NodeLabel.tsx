import type { ReactNode } from "react";
import {
  toolById,
  toolsIn,
  garmentsWith,
  garmentById as capoPerId,
  nodeById,
  sortedWeights,
  neighbours,
} from "./graph";
import type { ToolboxStep, ToolboxCopy } from "./types";

/**
 * L'etichetta cucita dentro il capo: marca, composizione, fibre, cura, e in
 * fondo «made to measure». E' la stessa sul computer (il pannello accanto alla
 * mappa) e sul telefono (il foglio che sale dal basso): cambia solo dove sta.
 *
 * Tutto quello che nomina un altro nodo o un capo e' un bottone, ed e' anche
 * il percorso da tastiera per la cassetta intera: dal cartellino si scende
 * agli scomparti, dagli scomparti agli attrezzi, dagli attrezzi a chi li usa.
 */
export function NodeLabel({
  step: passo,
  copy: testi,
  onNode: onNodo,
  onGarment: onCapo,
  actions: azioni,
  titleId: titoloId,
  toolsOnly: soloAttrezzi = false,
}: {
  step: ToolboxStep;
  copy: ToolboxCopy;
  onNode: (id: string) => void;
  onGarment: (id: string) => void;
  /** Indietro, e sul telefono chiudi: stanno nell'orlo. */
  actions?: ReactNode;
  titleId?: string;
  /** Sul telefono «si abbina a» elenca solo attrezzi: gli snodi li' non esistono. */
  toolsOnly?: boolean;
}) {
  const e = testi.label;

  const nomeNodo = (id: string) => {
    const n = nodeById(id);
    if (!n) return id;
    if (n.kind === "root") return testi.root.name;
    if (n.kind === "junction") return testi.zones[n.zone!].junction;
    return toolById(id)!.name;
  };

  const chipNodo = (id: string) => (
    <button
      key={id}
      type="button"
      data-toolbox-chip
      data-zone={nodeById(id)?.zone ?? undefined}
      onClick={() => onNodo(id)}
    >
      {nomeNodo(id)}
    </button>
  );

  const chipCapo = (id: string) => (
    <button
      key={id}
      type="button"
      data-toolbox-chip
      onClick={() => onCapo(id)}
    >
      {testi.garments[id].name}
    </button>
  );

  let titolo: string;
  let riga: string;
  let corpo: ReactNode;
  let taglia = e.sizeOne;

  if (passo.kind === "capo") {
    const c = capoPerId(passo.id)!;
    const tc = testi.garments[c.id];
    titolo = tc.name;
    riga = tc.why;
    taglia = tc.size;
    corpo = (
      <>
        <p data-label-item>
          {e.composition} <span data-label-estimate>· {e.estimate}</span>
        </p>
        <ul data-label-comp>
          {sortedWeights(c).map(([z, pc]) => (
            <li key={z} data-zone={z}>
              <span aria-hidden="true" style={{ width: `${pc}%` }} />
              <em>
                {pc}% {testi.zones[z].name}
              </em>
            </li>
          ))}
        </ul>
        <p data-label-item>{e.fibres}</p>
        <div data-label-chips>{c.uses.map(chipNodo)}</div>
        <p data-label-item>{e.care}</p>
        {c.alt.map(({ from: da, to: a }) => (
          <p key={da} data-label-care>
            <i aria-hidden="true">↺</i> {e.careIf} <b>{toolById(a)!.name}</b>{" "}
            {e.insteadOf} <b>{toolById(da)!.name}</b>: {tc.alt[da]}.
          </p>
        ))}
      </>
    );
  } else {
    const n = nodeById(passo.id)!;
    // Lo scomparto di un attrezzo ha gia' la sua voce: qui non si ripete.
    const conChi = neighbours(n.id).filter(
      (id) =>
        (!soloAttrezzi || nodeById(id)?.kind === "tool") &&
        !(n.kind === "tool" && id === n.zone),
    );
    const abbina = conChi.length ? (
      <>
        <p data-label-item>{e.pairsWith}</p>
        <div data-label-chips>{conChi.map(chipNodo)}</div>
      </>
    ) : null;

    if (n.kind === "root") {
      titolo = testi.root.name;
      riga = testi.root.what;
      corpo = abbina;
    } else if (n.kind === "junction") {
      const z = testi.zones[n.zone!];
      const dentro = toolsIn(n.zone!).map((a) => a.id);
      // Oltre a quello che contiene, lo scomparto porta agli scomparti
      // vicini: da tastiera e' l'unico modo di passare dal back-end ai dati
      // senza scendere dentro un attrezzo.
      const fuori = conChi.filter((id) => !dentro.includes(id));
      titolo = z.name;
      riga = z.what;
      corpo = (
        <>
          <p data-label-item>{e.contains}</p>
          <div data-label-chips>{dentro.map(chipNodo)}</div>
          {fuori.length > 0 && (
            <>
              <p data-label-item>{e.pairsWith}</p>
              <div data-label-chips>{fuori.map(chipNodo)}</div>
            </>
          )}
        </>
      );
    } else {
      const a = toolById(n.id)!;
      const per = garmentsWith(n.id);
      titolo = a.name;
      riga = testi.tools[a.id].what;
      corpo = (
        <>
          <p data-label-item>{e.tried}</p>
          <p data-label-line data-experience={a.experience}>
            {a.experience === "work" ? e.atWork : e.known}
          </p>
          <p data-label-item>{e.compartment}</p>
          <div data-label-chips>
            {soloAttrezzi ? (
              <span data-label-line>{testi.zones[a.zone].name}</span>
            ) : (
              chipNodo(a.zone)
            )}
          </div>
          <p data-label-item>{e.fitsIn}</p>
          <div data-label-chips>
            {per.length ? (
              per.map((c) => chipCapo(c.id))
            ) : (
              <span data-label-line>{e.onRequest}</span>
            )}
          </div>
          {abbina}
        </>
      );
    }
  }

  return (
    <div data-label>
      <div data-label-hem>{azioni}</div>
      <p data-label-brand>{e.brand}</p>
      <h3 id={titoloId}>{titolo}</h3>
      <p data-label-line>{riga}</p>
      {corpo}
      <p data-label-size>{taglia}</p>
    </div>
  );
}
