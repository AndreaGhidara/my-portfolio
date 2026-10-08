import type { ReactNode } from "react";
import {
  toolById,
  toolsIn,
  garmentsWith,
  garmentById,
  nodeById,
  sortedWeights,
  neighbours,
} from "./graph";
import type { ToolboxStep, ToolboxCopy } from "./types";

// La stessa nel pannello della mappa e nel foglio del telefono. Ogni nodo o
// capo nominato e' un bottone: e' il percorso da tastiera per la cassetta
// intera, perche' la mappa e' fuori dal giro dei Tab.
export function NodeLabel({
  step,
  copy,
  onNode,
  onGarment,
  actions,
  titleId,
  toolsOnly = false,
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
  const e = copy.label;

  const nodeName = (id: string) => {
    const n = nodeById(id);
    if (!n) return id;
    if (n.kind === "root") return copy.root.name;
    if (n.kind === "junction") return copy.zones[n.zone!].junction;
    return toolById(id)!.name;
  };

  const nodeChip = (id: string) => (
    <button
      key={id}
      type="button"
      data-toolbox-chip
      data-zone={nodeById(id)?.zone ?? undefined}
      onClick={() => onNode(id)}
    >
      {nodeName(id)}
    </button>
  );

  const garmentChip = (id: string) => (
    <button
      key={id}
      type="button"
      data-toolbox-chip
      onClick={() => onGarment(id)}
    >
      {copy.garments[id].name}
    </button>
  );

  let title: string;
  let line: string;
  let body: ReactNode;
  let size = e.sizeOne;

  if (step.kind === "garment") {
    const c = garmentById(step.id)!;
    const garmentCopy = copy.garments[c.id];
    title = garmentCopy.name;
    line = garmentCopy.why;
    size = garmentCopy.size;
    body = (
      <>
        <p data-label-item>
          {e.composition} <span data-label-estimate>· {e.estimate}</span>
        </p>
        <ul data-label-comp>
          {sortedWeights(c).map(([z, pc]) => (
            <li key={z} data-zone={z}>
              <span aria-hidden="true" style={{ width: `${pc}%` }} />
              <em>
                {pc}% {copy.zones[z].name}
              </em>
            </li>
          ))}
        </ul>
        <p data-label-item>{e.fibres}</p>
        <div data-label-chips>{c.uses.map(nodeChip)}</div>
        <p data-label-item>{e.care}</p>
        {c.alt.map(({ from, to }) => (
          <p key={from} data-label-care>
            <i aria-hidden="true">↺</i> {e.careIf} <b>{toolById(to)!.name}</b>{" "}
            {e.insteadOf} <b>{toolById(from)!.name}</b>: {garmentCopy.alt[from]}.
          </p>
        ))}
      </>
    );
  } else {
    const n = nodeById(step.id)!;
    // Lo scomparto di un attrezzo ha gia' la sua voce: qui non si ripete.
    const pairs = neighbours(n.id).filter(
      (id) =>
        (!toolsOnly || nodeById(id)?.kind === "tool") &&
        !(n.kind === "tool" && id === n.zone),
    );
    const pairing = pairs.length ? (
      <>
        <p data-label-item>{e.pairsWith}</p>
        <div data-label-chips>{pairs.map(nodeChip)}</div>
      </>
    ) : null;

    if (n.kind === "root") {
      title = copy.root.name;
      line = copy.root.what;
      body = pairing;
    } else if (n.kind === "junction") {
      const z = copy.zones[n.zone!];
      const inside = toolsIn(n.zone!).map((a) => a.id);
      // Oltre a quello che contiene, lo scomparto porta agli scomparti
      // vicini: da tastiera e' l'unico modo di passare dal back-end ai dati
      // senza scendere dentro un attrezzo.
      const outside = pairs.filter((id) => !inside.includes(id));
      title = z.name;
      line = z.what;
      body = (
        <>
          <p data-label-item>{e.contains}</p>
          <div data-label-chips>{inside.map(nodeChip)}</div>
          {outside.length > 0 && (
            <>
              <p data-label-item>{e.pairsWith}</p>
              <div data-label-chips>{outside.map(nodeChip)}</div>
            </>
          )}
        </>
      );
    } else {
      const a = toolById(n.id)!;
      const usedIn = garmentsWith(n.id);
      title = a.name;
      line = copy.tools[a.id].what;
      body = (
        <>
          <p data-label-item>{e.tried}</p>
          <p data-label-line data-experience={a.experience}>
            {a.experience === "work" ? e.atWork : e.known}
          </p>
          <p data-label-item>{e.compartment}</p>
          <div data-label-chips>
            {toolsOnly ? (
              <span data-label-line>{copy.zones[a.zone].name}</span>
            ) : (
              nodeChip(a.zone)
            )}
          </div>
          <p data-label-item>{e.fitsIn}</p>
          <div data-label-chips>
            {usedIn.length ? (
              usedIn.map((c) => garmentChip(c.id))
            ) : (
              <span data-label-line>{e.onRequest}</span>
            )}
          </div>
          {pairing}
        </>
      );
    }
  }

  return (
    <div data-label>
      <div data-label-hem>{actions}</div>
      <p data-label-brand>{e.brand}</p>
      <h3 id={titleId}>{title}</h3>
      <p data-label-line>{line}</p>
      {body}
      <p data-label-size>{size}</p>
    </div>
  );
}
