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

type NodeKind = "root" | "junction" | "tool";

type GraphNode = {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
  zone: ZoneId | null;
};

export const NODES: readonly GraphNode[] = [
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

const nodesById = new Map(NODES.map((n) => [n.id, n]));
const toolsById = new Map(TOOLS.map((a) => [a.id, a]));

export function nodeById(id: string): GraphNode | undefined {
  return nodesById.get(id);
}

export function toolById(id: string): Tool | undefined {
  return toolsById.get(id);
}

export function garmentById(id: string): Garment | undefined {
  return GARMENTS.find((c) => c.id === id);
}

export function toolsIn(zone: ZoneId): Tool[] {
  return TOOLS.filter((a) => a.zone === zone);
}

/** Tutti quelli con cui un nodo ha un filo, rami e incroci insieme. */
export function neighbours(id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of [...BRANCHES, ...CROSSINGS]) {
    if (a === id && !out.includes(b)) out.push(b);
    if (b === id && !out.includes(a)) out.push(a);
  }
  return out;
}

/** Il padre di ogni nodo nell'albero: il primo ramo che lo nomina come figlio. */
const parents = new Map<string, string>();
for (const [a, b] of BRANCHES) if (!parents.has(b)) parents.set(b, a);

export function parentOf(id: string): string | undefined {
  return parents.get(id);
}

/** Dal nodo su fino al cartellino (o fino a dove l'albero finisce). */
export function pathTo(id: string): string[] {
  const s = [id];
  let up = parents.get(id);
  while (up && !s.includes(up)) {
    s.push(up);
    up = parents.get(up);
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
  const used = c.uses
    .map((id) => nodesById.get(id))
    .filter((n): n is GraphNode => !!n)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((n) => n.id);
  return [ROOT.id, ...used];
}

/** Gli scomparti di un capo nell'ordine delle zone, con i loro attrezzi. */
export function byZone(c: Garment): { zone: ZoneId; tools: string[] }[] {
  return ZONES.map((z) => ({
    zone: z.id,
    tools: c.uses.filter((id) => toolsById.get(id)?.zone === z.id),
  })).filter((g) => g.tools.length > 0);
}

/**
 * La larghezza di un'etichetta cucita, in unita' della mappa. Il carattere e'
 * monospazio, quindi si conta: e' il conto del prototipo, e tiene i nomi
 * dentro il bordo a punti senza misurare niente nel browser (il server rende
 * la mappa gia' finita).
 */
export function nodeWidth(kind: NodeKind, text: string): number {
  if (kind === "root") return 170;
  return Math.max(70, text.length * (kind === "junction" ? 7.6 : 7.3) + 24);
}

export function nodeHeight(kind: NodeKind): number {
  return kind === "root" ? 46 : kind === "junction" ? 26 : 30;
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
export function seam(points: { x: number; y: number }[]): {
  d: string;
  partials: string[];
} {
  if (!points.length) return { d: "", partials: [] };
  let d = `M${points[0].x} ${points[0].y}`;
  const partials = [d];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + (i % 2 ? 18 : -18);
    d += ` Q${mx} ${my} ${b.x} ${b.y}`;
    partials.push(d);
  }
  return { d, partials };
}
