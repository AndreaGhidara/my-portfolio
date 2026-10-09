import type { CSSProperties, ReactNode } from "react";
import type { SampleId } from "@/content/desk";

// DOM e non maschere: una maschera dipinge un colore solo, e i campioni sono a
// piu' colori. Sempre aria-hidden: il nome lo porta gia' l'etichetta. Le
// marche sono poche e condivise; la disposizione sta in styles/sections/desk.css.

const Line = ({ w }: { w: number }) => (
  <i data-m="line" style={{ "--w": `${w}%` } as CSSProperties} />
);

const Bar = ({ h }: { h: number }) => (
  <i data-m="bar" style={{ "--h": `${h}%` } as CSSProperties} />
);

const grid = (n: number, mark: string, grabbed?: number) =>
  Array.from({ length: n }, (_, i) => (
    <i key={i} data-m={mark} data-grabbed={i === grabbed ? "" : undefined} />
  ));

export const SPECIMENS: Record<SampleId, ReactNode> = {
  colori: (
    <>
      <i data-m="swatch" data-t="paper" />
      <i data-m="swatch" data-t="accent" />
      <i data-m="swatch" data-t="ink" />
    </>
  ),
  caratteri: <b data-m="aa">Aa</b>,
  sezioni: (
    <>
      <i data-m="block" data-b="header" />
      <span data-m="columns">
        <i data-m="block" data-b="wide" />
        <i data-m="block" data-b="narrow" />
      </span>
      <i data-m="block" data-b="foot" />
    </>
  ),
  testi: (
    <>
      <Line w={100} />
      <Line w={88} />
      <Line w={96} />
      <Line w={58} />
    </>
  ),
  immagini: (
    <>
      <i data-m="sky" />
      <i data-m="sun" />
      <i data-m="mountain" />
    </>
  ),
  telefono: (
    <>
      <i data-m="block" data-b="header" />
      <Line w={100} />
      <Line w={100} />
      <Line w={80} />
      <i data-m="cta" />
    </>
  ),

  contatti: (
    <>
      <i data-m="field" />
      <i data-m="field" />
      <i data-m="cta" />
    </>
  ),
  riservata: (
    <>
      <i data-m="field" />
      <span data-m="dots">{grid(6, "dot")}</span>
      <i data-m="cta" data-small="" />
    </>
  ),
  catalogo: (
    <span data-m="card">
      <i data-m="tile" data-large="" />
      <span data-m="detail">
        <Line w={100} />
        <Line w={70} />
        <i data-m="price" />
      </span>
    </span>
  ),
  pagamenti: (
    <span data-m="receipt">
      <Line w={78} />
      <Line w={62} />
      <Line w={70} />
      <i data-m="tear" />
      <span data-m="item" data-total="">
        <Line w={38} />
        <i data-m="amount" />
      </span>
    </span>
  ),
  prenotazioni: (
    <>
      <i data-m="line" data-head="" style={{ "--w": "100%" } as CSSProperties} />
      <span data-m="month">{grid(18, "day", 9)}</span>
    </>
  ),
  gestionale: (
    <>
      <b data-m="mono">ART-0412</b>
      <Line w={64} />
      <span data-m="qty">
        <Line w={34} />
        <b data-m="mono" data-small="">
          ×24
        </b>
      </span>
    </>
  ),

  dati: <span data-m="table" data-dense="">{grid(18, "cell")}</span>,
  copie: (
    <>
      <i data-m="copy" data-i="3" />
      <i data-m="copy" data-i="2" />
      <i data-m="copy" data-i="1" />
    </>
  ),
  dominio: <b data-m="mono">nome.it</b>,
  sicurezza: <b data-m="mono">https://</b>,
  velocita: <b data-m="mono">0,4 s</b>,

  assistente: (
    <>
      <i data-m="bubble" data-side="here" />
      <i data-m="bubble" data-side="there" />
    </>
  ),
  automazioni: (
    <span data-m="flow">
      <i data-m="node" />
      <i data-m="node" />
      <i data-m="node" />
    </span>
  ),
  numeri: (
    <span data-m="histogram">
      <Bar h={38} />
      <Bar h={58} />
      <Bar h={46} />
      <Bar h={78} />
      <Bar h={100} />
    </span>
  ),
  trovare: (
    <>
      {[
        [86, 52],
        [64, 40],
        [58, 44],
      ].map(([title, url], i) => (
        <span key={i} data-m="result" data-first={i === 0 ? "" : undefined}>
          <i data-m="line" style={{ "--w": `${title}%` } as CSSProperties} />
          <i data-m="line" data-url="" style={{ "--w": `${url}%` } as CSSProperties} />
        </span>
      ))}
    </>
  ),
  manutenzione: <b data-m="mono">v2.4 → v2.5</b>,
};

// Fratello della sagoma e non figlio: [data-desk-shape] porta l'ombra, che
// sulle marche di un campione impasterebbe il disegno.
export function DeskSpecimen({ sample }: { sample: SampleId }) {
  return (
    <span data-desk-sample={sample} aria-hidden="true">
      {SPECIMENS[sample]}
    </span>
  );
}
