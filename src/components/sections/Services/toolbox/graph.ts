import {
  TOOLS,
  GARMENTS,
  CROSSINGS,
  ROOT,
  BRANCHES,
  JUNCTIONS,
  ZONES,
  type Tool,
  type Garment,
  type ZoneId,
} from "@/content/toolbox";

/**
 * Le domande che la mappa, l'editor e l'etichetta fanno alla cassetta. Sono
 * funzioni pure sui dati di content/cassetta.ts: la parte che si sbaglia si
 * prova in un test, e i componenti restano disegno.
 */

type TipoNodo = "root" | "junction" | "tool";

type Nodo = {
  id: string;
  x: number;
  y: number;
  kind: TipoNodo;
  zone: ZoneId | null;
};

export const NODES: readonly Nodo[] = [
  { id: ROOT.id, x: ROOT.x, y: ROOT.y, kind: "root", zone: null },
  ...JUNCTIONS.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    kind: "junction" as const,
    zone: s.id,
  })),
  ...TOOLS.map((a) => ({
    id: a.id,
    x: a.x,
    y: a.y,
    kind: "tool" as const,
    zone: a.zone,
  })),
];

const perId = new Map(NODES.map((n) => [n.id, n]));
const attrezzoPerId = new Map(TOOLS.map((a) => [a.id, a]));

export function nodeById(id: string): Nodo | undefined {
  return perId.get(id);
}

export function toolById(id: string): Tool | undefined {
  return attrezzoPerId.get(id);
}

export function garmentById(id: string): Garment | undefined {
  return GARMENTS.find((c) => c.id === id);
}

export function toolsIn(zona: ZoneId): Tool[] {
  return TOOLS.filter((a) => a.zone === zona);
}

/** Tutti quelli con cui un nodo ha un filo, rami e incroci insieme. */
export function neighbours(id: string): string[] {
  const fuori: string[] = [];
  for (const [a, b] of [...BRANCHES, ...CROSSINGS]) {
    if (a === id && !fuori.includes(b)) fuori.push(b);
    if (b === id && !fuori.includes(a)) fuori.push(a);
  }
  return fuori;
}

/** Il padre di ogni nodo nell'albero: il primo ramo che lo nomina come figlio. */
const padri = new Map<string, string>();
for (const [a, b] of BRANCHES) if (!padri.has(b)) padri.set(b, a);

export function parentOf(id: string): string | undefined {
  return padri.get(id);
}

/** Dal nodo su fino al cartellino (o fino a dove l'albero finisce). */
export function pathTo(id: string): string[] {
  const s = [id];
  let su = padri.get(id);
  while (su && !s.includes(su)) {
    s.push(su);
    su = padri.get(su);
  }
  return s;
}

/** I capi in cui un attrezzo entra. */
export function garmentsWith(id: string): Garment[] {
  return GARMENTS.filter((c) => c.uses.includes(id));
}

/** Le zone di un capo, dalla piu' pesante. */
export function sortedWeights(c: Garment): [ZoneId, number][] {
  return (Object.entries(c.weight) as [ZoneId, number][]).sort(
    (a, b) => b[1] - a[1],
  );
}

/**
 * L'ordine in cui l'ago passa: dal cartellino in giu', riga per riga, da
 * sinistra a destra. E' l'ordine in cui si legge la mappa.
 */
export function garmentStops(c: Garment): string[] {
  const usati = c.uses
    .map((id) => perId.get(id))
    .filter((n): n is Nodo => !!n)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((n) => n.id);
  return [ROOT.id, ...usati];
}

/** Gli scomparti di un capo nell'ordine delle zone, con i loro attrezzi. */
export function byZone(c: Garment): { zone: ZoneId; tools: string[] }[] {
  return ZONES.map((z) => ({
    zone: z.id,
    tools: c.uses.filter((id) => attrezzoPerId.get(id)?.zone === z.id),
  })).filter((g) => g.tools.length > 0);
}

/**
 * La larghezza di un'etichetta cucita, in unita' della mappa. Il carattere e'
 * monospazio, quindi si conta: e' il conto del prototipo, e tiene i nomi
 * dentro il bordo a punti senza misurare niente nel browser (il server rende
 * la mappa gia' finita).
 */
export function nodeWidth(tipo: TipoNodo, testo: string): number {
  if (tipo === "root") return 170;
  return Math.max(70, testo.length * (tipo === "junction" ? 7.6 : 7.3) + 24);
}

export function nodeHeight(tipo: TipoNodo): number {
  return tipo === "root" ? 46 : tipo === "junction" ? 26 : 30;
}

/** Il filo fra due nodi: una cubica con i controlli a meta' altezza. */
export function curve(
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
export function seam(punti: { x: number; y: number }[]): {
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
