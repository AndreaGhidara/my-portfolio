import type { ReactNode } from "react";
import {
  attrezzo,
  attrezziDi,
  capiCon,
  capo as capoPerId,
  nodo,
  pesiOrdinati,
  vicini,
} from "./graph";
import type { Passo, TestiCassetta } from "./types";

/**
 * L'etichetta cucita dentro il capo: marca, composizione, fibre, cura, e in
 * fondo «made to measure». E' la stessa sul computer (il pannello accanto alla
 * mappa) e sul telefono (il foglio che sale dal basso): cambia solo dove sta.
 *
 * Tutto quello che nomina un altro nodo o un capo e' un bottone, ed e' anche
 * il percorso da tastiera per la cassetta intera: dal cartellino si scende
 * agli scomparti, dagli scomparti agli attrezzi, dagli attrezzi a chi li usa.
 */
export function Etichetta({
  passo,
  testi,
  onNodo,
  onCapo,
  azioni,
  titoloId,
  soloAttrezzi = false,
}: {
  passo: Passo;
  testi: TestiCassetta;
  onNodo: (id: string) => void;
  onCapo: (id: string) => void;
  /** Indietro, e sul telefono chiudi: stanno nell'orlo. */
  azioni?: ReactNode;
  titoloId?: string;
  /** Sul telefono «si abbina a» elenca solo attrezzi: gli snodi li' non esistono. */
  soloAttrezzi?: boolean;
}) {
  const e = testi.etichetta;

  const nomeNodo = (id: string) => {
    const n = nodo(id);
    if (!n) return id;
    if (n.tipo === "radice") return testi.radice.nome;
    if (n.tipo === "snodo") return testi.zone[n.zona!].snodo;
    return attrezzo(id)!.nome;
  };

  const chipNodo = (id: string) => (
    <button
      key={id}
      type="button"
      data-cassetta-chip
      data-zona={nodo(id)?.zona ?? undefined}
      onClick={() => onNodo(id)}
    >
      {nomeNodo(id)}
    </button>
  );

  const chipCapo = (id: string) => (
    <button
      key={id}
      type="button"
      data-cassetta-chip
      onClick={() => onCapo(id)}
    >
      {testi.capi[id].nome}
    </button>
  );

  let titolo: string;
  let riga: string;
  let corpo: ReactNode;
  let taglia = e.tagliaUno;

  if (passo.tipo === "capo") {
    const c = capoPerId(passo.id)!;
    const tc = testi.capi[c.id];
    titolo = tc.nome;
    riga = tc.perche;
    taglia = tc.taglia;
    corpo = (
      <>
        <p data-etichetta-voce>
          {e.composizione} <span data-etichetta-stima>· {e.stima}</span>
        </p>
        <ul data-etichetta-comp>
          {pesiOrdinati(c).map(([z, pc]) => (
            <li key={z} data-zona={z}>
              <span aria-hidden="true" style={{ width: `${pc}%` }} />
              <em>
                {pc}% {testi.zone[z].nome}
              </em>
            </li>
          ))}
        </ul>
        <p data-etichetta-voce>{e.fibre}</p>
        <div data-etichetta-chips>{c.usa.map(chipNodo)}</div>
        <p data-etichetta-voce>{e.cura}</p>
        {c.alt.map(({ da, a }) => (
          <p key={da} data-etichetta-cura>
            <i aria-hidden="true">↺</i> {e.curaSe} <b>{attrezzo(a)!.nome}</b>{" "}
            {e.alPosto} <b>{attrezzo(da)!.nome}</b>: {tc.alt[da]}.
          </p>
        ))}
      </>
    );
  } else {
    const n = nodo(passo.id)!;
    // Lo scomparto di un attrezzo ha gia' la sua voce: qui non si ripete.
    const conChi = vicini(n.id).filter(
      (id) =>
        (!soloAttrezzi || nodo(id)?.tipo === "attrezzo") &&
        !(n.tipo === "attrezzo" && id === n.zona),
    );
    const abbina = conChi.length ? (
      <>
        <p data-etichetta-voce>{e.siAbbina}</p>
        <div data-etichetta-chips>{conChi.map(chipNodo)}</div>
      </>
    ) : null;

    if (n.tipo === "radice") {
      titolo = testi.radice.nome;
      riga = testi.radice.cosa;
      corpo = abbina;
    } else if (n.tipo === "snodo") {
      const z = testi.zone[n.zona!];
      const dentro = attrezziDi(n.zona!).map((a) => a.id);
      // Oltre a quello che contiene, lo scomparto porta agli scomparti
      // vicini: da tastiera e' l'unico modo di passare dal back-end ai dati
      // senza scendere dentro un attrezzo.
      const fuori = conChi.filter((id) => !dentro.includes(id));
      titolo = z.nome;
      riga = z.cosa;
      corpo = (
        <>
          <p data-etichetta-voce>{e.contiene}</p>
          <div data-etichetta-chips>{dentro.map(chipNodo)}</div>
          {fuori.length > 0 && (
            <>
              <p data-etichetta-voce>{e.siAbbina}</p>
              <div data-etichetta-chips>{fuori.map(chipNodo)}</div>
            </>
          )}
        </>
      );
    } else {
      const a = attrezzo(n.id)!;
      const per = capiCon(n.id);
      titolo = a.nome;
      riga = testi.attrezzi[a.id].cosa;
      corpo = (
        <>
          <p data-etichetta-voce>{e.provato}</p>
          <p data-etichetta-riga data-provato={a.provato}>
            {a.provato === "lavoro" ? e.lavoro : e.conosciuto}
          </p>
          <p data-etichetta-voce>{e.scomparto}</p>
          <div data-etichetta-chips>
            {soloAttrezzi ? (
              <span data-etichetta-riga>{testi.zone[a.zona].nome}</span>
            ) : (
              chipNodo(a.zona)
            )}
          </div>
          <p data-etichetta-voce>{e.entraIn}</p>
          <div data-etichetta-chips>
            {per.length ? (
              per.map((c) => chipCapo(c.id))
            ) : (
              <span data-etichetta-riga>{e.suRichiesta}</span>
            )}
          </div>
          {abbina}
        </>
      );
    }
  }

  return (
    <div data-etichetta>
      <div data-etichetta-orlo>{azioni}</div>
      <p data-etichetta-marca>{e.marca}</p>
      <h3 id={titoloId}>{titolo}</h3>
      <p data-etichetta-riga>{riga}</p>
      {corpo}
      <p data-etichetta-taglia>{taglia}</p>
    </div>
  );
}
