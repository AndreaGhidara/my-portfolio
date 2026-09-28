import {
  ATTREZZI,
  CAPI,
  INCROCI,
  RADICE,
  RAMI,
  SNODI,
  ZONE,
  type Attrezzo,
  type Capo,
  type ZonaId,
} from "@/content/cassetta";

/**
 * Le domande che la mappa, l'editor e l'etichetta fanno alla cassetta. Sono
 * funzioni pure sui dati di content/cassetta.ts: la parte che si sbaglia si
 * prova in un test, e i componenti restano disegno.
 */

type TipoNodo = "radice" | "snodo" | "attrezzo";

type Nodo = {
  id: string;
  x: number;
  y: number;
  tipo: TipoNodo;
  zona: ZonaId | null;
};

export const NODI: readonly Nodo[] = [
  { id: RADICE.id, x: RADICE.x, y: RADICE.y, tipo: "radice", zona: null },
  ...SNODI.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    tipo: "snodo" as const,
    zona: s.id,
  })),
  ...ATTREZZI.map((a) => ({
    id: a.id,
    x: a.x,
    y: a.y,
    tipo: "attrezzo" as const,
    zona: a.zona,
  })),
];

const perId = new Map(NODI.map((n) => [n.id, n]));
const attrezzoPerId = new Map(ATTREZZI.map((a) => [a.id, a]));

export function nodo(id: string): Nodo | undefined {
  return perId.get(id);
}

export function attrezzo(id: string): Attrezzo | undefined {
  return attrezzoPerId.get(id);
}

export function capo(id: string): Capo | undefined {
  return CAPI.find((c) => c.id === id);
}

export function attrezziDi(zona: ZonaId): Attrezzo[] {
  return ATTREZZI.filter((a) => a.zona === zona);
}

/** Tutti quelli con cui un nodo ha un filo, rami e incroci insieme. */
export function vicini(id: string): string[] {
  const fuori: string[] = [];
  for (const [a, b] of [...RAMI, ...INCROCI]) {
    if (a === id && !fuori.includes(b)) fuori.push(b);
    if (b === id && !fuori.includes(a)) fuori.push(a);
  }
  return fuori;
}

/** Il padre di ogni nodo nell'albero: il primo ramo che lo nomina come figlio. */
const padri = new Map<string, string>();
for (const [a, b] of RAMI) if (!padri.has(b)) padri.set(b, a);

export function padre(id: string): string | undefined {
  return padri.get(id);
}

/** Dal nodo su fino al cartellino (o fino a dove l'albero finisce). */
export function strada(id: string): string[] {
  const s = [id];
  let su = padri.get(id);
  while (su && !s.includes(su)) {
    s.push(su);
    su = padri.get(su);
  }
  return s;
}

/** I capi in cui un attrezzo entra. */
export function capiCon(id: string): Capo[] {
  return CAPI.filter((c) => c.usa.includes(id));
}

/** Le zone di un capo, dalla piu' pesante. */
export function pesiOrdinati(c: Capo): [ZonaId, number][] {
  return (Object.entries(c.peso) as [ZonaId, number][]).sort(
    (a, b) => b[1] - a[1],
  );
}

/**
 * L'ordine in cui l'ago passa: dal cartellino in giu', riga per riga, da
 * sinistra a destra. E' l'ordine in cui si legge la mappa.
 */
export function tappe(c: Capo): string[] {
  const usati = c.usa
    .map((id) => perId.get(id))
    .filter((n): n is Nodo => !!n)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((n) => n.id);
  return [RADICE.id, ...usati];
}

/** Gli scomparti di un capo nell'ordine delle zone, con i loro attrezzi. */
export function perZona(c: Capo): { zona: ZonaId; attrezzi: string[] }[] {
  return ZONE.map((z) => ({
    zona: z.id,
    attrezzi: c.usa.filter((id) => attrezzoPerId.get(id)?.zona === z.id),
  })).filter((g) => g.attrezzi.length > 0);
}

/**
 * La larghezza di un'etichetta cucita, in unita' della mappa. Il carattere e'
 * monospazio, quindi si conta: e' il conto del prototipo, e tiene i nomi
 * dentro il bordo a punti senza misurare niente nel browser (il server rende
 * la mappa gia' finita).
 */
export function larghezza(tipo: TipoNodo, testo: string): number {
  if (tipo === "radice") return 170;
  return Math.max(70, testo.length * (tipo === "snodo" ? 7.6 : 7.3) + 24);
}

export function altezza(tipo: TipoNodo): number {
  return tipo === "radice" ? 46 : tipo === "snodo" ? 26 : 30;
}

/** Il filo fra due nodi: una cubica con i controlli a meta' altezza. */
export function curva(
  a: { x: number; y: number },
  b: { x: number; y: number },
): string {
  const my = (a.y + b.y) / 2;
  return `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
}

/**
 * La cucitura dell'ago: una curva morbida da tappa a tappa, che ondeggia su e
 * giu' come un punto a mano. Restituisce anche le curve parziali, perche'
 * sapere dove sta ogni tappa lungo il filo serve a dire quando l'ago ci passa.
 */
export function cucitura(punti: { x: number; y: number }[]): {
  d: string;
  parziali: string[];
} {
  if (!punti.length) return { d: "", parziali: [] };
  let d = `M${punti[0].x} ${punti[0].y}`;
  const parziali = [d];
  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1];
    const b = punti[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + (i % 2 ? 18 : -18);
    d += ` Q${mx} ${my} ${b.x} ${b.y}`;
    parziali.push(d);
  }
  return { d, parziali };
}
