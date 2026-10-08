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

// Funzioni pure sui dati di content/toolbox.ts, tenute fuori dai componenti
// per provarle in un test.

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

/** Rami e incroci insieme. */
export function neighbours(id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of [...BRANCHES, ...CROSSINGS]) {
    if (a === id && !out.includes(b)) out.push(b);
    if (b === id && !out.includes(a)) out.push(a);
  }
  return out;
}

// Vale il primo ramo che nomina il nodo come figlio.
const parents = new Map<string, string>();
for (const [a, b] of BRANCHES) if (!parents.has(b)) parents.set(b, a);

export function parentOf(id: string): string | undefined {
  return parents.get(id);
}

/** Fino al cartellino, o a dove l'albero finisce: i nodi sciolti non ci arrivano. */
export function pathTo(id: string): string[] {
  const s = [id];
  let up = parents.get(id);
  while (up && !s.includes(up)) {
    s.push(up);
    up = parents.get(up);
  }
  return s;
}

export function garmentsWith(id: string): Garment[] {
  return GARMENTS.filter((c) => c.uses.includes(id));
}

export function sortedWeights(c: Garment): [ZoneId, number][] {
  return (Object.entries(c.weight) as [ZoneId, number][]).sort(
    (a, b) => b[1] - a[1],
  );
}

/** Dal cartellino in giu', da sinistra a destra: l'ordine in cui si legge la mappa. */
export function garmentStops(c: Garment): string[] {
  const used = c.uses
    .map((id) => nodesById.get(id))
    .filter((n): n is GraphNode => !!n)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((n) => n.id);
  return [ROOT.id, ...used];
}

export function byZone(c: Garment): { zone: ZoneId; tools: string[] }[] {
  return ZONES.map((z) => ({
    zone: z.id,
    tools: c.uses.filter((id) => toolsById.get(id)?.zone === z.id),
  })).filter((g) => g.tools.length > 0);
}

// Il carattere e' monospazio, quindi la larghezza si conta invece di misurarla:
// il server rende la mappa gia' finita, senza un browser.
export function nodeWidth(kind: NodeKind, text: string): number {
  if (kind === "root") return 170;
  return Math.max(70, text.length * (kind === "junction" ? 7.6 : 7.3) + 24);
}

export function nodeHeight(kind: NodeKind): number {
  return kind === "root" ? 46 : kind === "junction" ? 26 : 30;
}

export function curve(
  a: { x: number; y: number },
  b: { x: number; y: number },
): string {
  const my = (a.y + b.y) / 2;
  return `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
}

// Le curve parziali servono a sapere dove sta ogni tappa lungo il filo, cioe'
// quando l'ago ci passa.
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
