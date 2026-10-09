// I testi stanno in messages sotto `cassetta`; i nomi degli attrezzi restano
// qui perche' sono marchi e non si traducono. Coordinate in unita' del viewBox
// 1200 x 820 della mappa.

export type ZoneId = "front" | "stili" | "mezzo" | "back" | "auth" | "dati" | "casa" | "ovunque" | "ai";

export type Zone = {
  id: ZoneId;
  /** x, y, larghezza, altezza. */
  r: readonly [number, number, number, number];
};

// L'ordine e' quello dell'editor e dell'elenco per scomparti.
export const ZONES: readonly Zone[] = [
  { id: "front", r: [40, 150, 400, 150] },
  { id: "stili", r: [40, 330, 400, 170] },
  { id: "mezzo", r: [470, 150, 260, 350] },
  { id: "back", r: [760, 150, 400, 150] },
  { id: "auth", r: [760, 330, 400, 170] },
  { id: "dati", r: [300, 540, 600, 120] },
  { id: "casa", r: [300, 690, 600, 100] },
  { id: "ai", r: [930, 540, 230, 250] },
  { id: "ovunque", r: [40, 540, 230, 250] },
];

// `work` se compare nei lavori, nel CV, nella scheda del colloquio o in questo
// sito; altrimenti `known`. L'etichetta li distingue per non promettere troppo.
export type Experience = "work" | "known";

export type Tool = {
  /** Anche la chiave di traduzione: cassetta.attrezzi.<id>. */
  id: string;
  name: string;
  zone: ZoneId;
  x: number;
  y: number;
  experience: Experience;
};

export const TOOLS: readonly Tool[] = [
  { id: "nextjs", name: "Next.js", zone: "front", x: 150, y: 250, experience: "work" },
  { id: "react", name: "React", zone: "front", x: 330, y: 250, experience: "work" },
  { id: "tailwind", name: "Tailwind CSS", zone: "stili", x: 120, y: 420, experience: "work" },
  // Questo sito e' montato con shadcn/ui (components.json), e Radix sta sotto.
  { id: "shadcn-ui", name: "shadcn/ui", zone: "stili", x: 250, y: 420, experience: "work" },
  { id: "gsap", name: "GSAP", zone: "stili", x: 365, y: 420, experience: "work" },
  { id: "framer-motion", name: "Framer Motion", zone: "stili", x: 150, y: 470, experience: "known" },
  { id: "radix", name: "Radix", zone: "stili", x: 330, y: 470, experience: "work" },
  { id: "graphql", name: "GraphQL", zone: "mezzo", x: 600, y: 250, experience: "work" },
  { id: "rest", name: "REST", zone: "mezzo", x: 530, y: 320, experience: "work" },
  { id: "trpc", name: "tRPC", zone: "mezzo", x: 670, y: 320, experience: "known" },
  { id: "redis", name: "Redis", zone: "mezzo", x: 600, y: 410, experience: "known" },
  // Nella scheda del colloquio c'e' come scelta ragionata (la 83), non come
  // lavoro consegnato: la regola dice «compare», e compare.
  { id: "websocket", name: "WebSocket", zone: "mezzo", x: 600, y: 470, experience: "work" },
  { id: "nodejs", name: "Node.js", zone: "back", x: 850, y: 250, experience: "work" },
  { id: "express", name: "Express", zone: "back", x: 960, y: 250, experience: "work" },
  { id: "nestjs", name: "NestJS", zone: "back", x: 1075, y: 250, experience: "known" },
  { id: "clerk", name: "Clerk", zone: "auth", x: 830, y: 420, experience: "known" },
  { id: "authjs", name: "Auth.js", zone: "auth", x: 960, y: 420, experience: "known" },
  // Supabase c'e' nel CV e nei lavori, i suoi accessi no: meglio dire meno.
  { id: "supabase-auth", name: "Supabase Auth", zone: "auth", x: 1085, y: 420, experience: "known" },
  { id: "better-auth", name: "Better Auth", zone: "auth", x: 880, y: 470, experience: "known" },
  { id: "jwt", name: "JWT", zone: "auth", x: 1040, y: 470, experience: "work" },
  { id: "postgresql", name: "PostgreSQL", zone: "dati", x: 370, y: 625, experience: "work" },
  { id: "mysql", name: "MySQL", zone: "dati", x: 480, y: 625, experience: "known" },
  { id: "mongodb", name: "MongoDB", zone: "dati", x: 590, y: 625, experience: "known" },
  { id: "prisma", name: "Prisma", zone: "dati", x: 715, y: 625, experience: "known" },
  { id: "drizzle", name: "Drizzle", zone: "dati", x: 830, y: 625, experience: "known" },
  { id: "vercel", name: "Vercel", zone: "casa", x: 420, y: 760, experience: "work" },
  { id: "railway", name: "Railway", zone: "casa", x: 600, y: 760, experience: "work" },
  { id: "docker", name: "Docker", zone: "casa", x: 780, y: 760, experience: "known" },
  { id: "typescript", name: "TypeScript", zone: "ovunque", x: 155, y: 630, experience: "work" },
  { id: "git", name: "Git", zone: "ovunque", x: 100, y: 690, experience: "work" },
  { id: "vitest", name: "Vitest", zone: "ovunque", x: 210, y: 690, experience: "work" },
  { id: "zod", name: "Zod", zone: "ovunque", x: 155, y: 750, experience: "work" },
  { id: "langchain", name: "LangChain", zone: "ai", x: 1045, y: 630, experience: "work" },
  { id: "vercel-ai-sdk", name: "Vercel AI SDK", zone: "ai", x: 1045, y: 690, experience: "known" },
  { id: "pgvector", name: "pgvector", zone: "ai", x: 1045, y: 750, experience: "known" },
];

export const ROOT = { id: "sito", x: 600, y: 62 } as const;

// Uno per scomparto, con l'id dello scomparto: il punto da cui si aprono i rami della zona.
export const JUNCTIONS: readonly { id: ZoneId; x: number; y: number }[] = [
  { id: "front", x: 240, y: 178 },
  { id: "mezzo", x: 600, y: 178 },
  { id: "back", x: 960, y: 178 },
  { id: "stili", x: 240, y: 358 },
  { id: "auth", x: 960, y: 358 },
  { id: "dati", x: 600, y: 568 },
  { id: "casa", x: 600, y: 712 },
  { id: "ovunque", x: 155, y: 568 },
  { id: "ai", x: 1045, y: 568 },
];

/** Dal padre al figlio. Se un nodo compare piu' volte come figlio, vale il primo padre. */
export const BRANCHES: readonly (readonly [string, string])[] = [
  ["sito", "front"], ["sito", "mezzo"], ["sito", "back"],
  ["front", "nextjs"], ["front", "react"], ["nextjs", "stili"], ["react", "stili"],
  ["stili", "tailwind"], ["stili", "shadcn-ui"], ["stili", "gsap"], ["stili", "framer-motion"], ["shadcn-ui", "radix"],
  // nel mezzo: cinque modi di parlarsi e di ricordare, nessuno sotto l'altro
  ["mezzo", "graphql"], ["mezzo", "rest"], ["mezzo", "trpc"], ["mezzo", "redis"], ["mezzo", "websocket"],
  // Express e NestJS girano su Node: sono figli suoi, non fratelli
  ["back", "nodejs"], ["nodejs", "express"], ["nodejs", "nestjs"], ["express", "auth"], ["nestjs", "auth"],
  ["auth", "clerk"], ["auth", "authjs"], ["auth", "supabase-auth"], ["auth", "better-auth"], ["auth", "jwt"],
  // i dati li interroga il back-end, e i dati girano su macchine
  ["back", "dati"], ["dati", "postgresql"], ["dati", "mysql"], ["dati", "mongodb"], ["dati", "prisma"], ["dati", "drizzle"],
  ["dati", "casa"], ["casa", "vercel"], ["casa", "railway"], ["casa", "docker"],
  // ovunque: attrezzi che non dipendono l'uno dall'altro
  ["ovunque", "typescript"], ["ovunque", "git"], ["ovunque", "vitest"], ["ovunque", "zod"],
  // l'AI vive nel back-end, e i suoi pezzi sono fratelli, non una catena
  ["back", "ai"], ["ai", "langchain"], ["ai", "vercel-ai-sdk"], ["ai", "pgvector"],
];

// Fili tratteggiati fuori dall'albero. «ovunque» non ha padre: si attacca al
// resto solo con i suoi due incroci (vedi LOOSE).
export const CROSSINGS: readonly (readonly [string, string])[] = [
  ["nextjs", "graphql"], ["nextjs", "trpc"], ["react", "rest"], ["graphql", "nestjs"], ["rest", "express"], ["trpc", "nodejs"],
  ["redis", "nodejs"], ["websocket", "nodejs"], ["tailwind", "shadcn-ui"], ["framer-motion", "react"],
  ["nextjs", "authjs"], ["nextjs", "clerk"], ["jwt", "express"], ["supabase-auth", "postgresql"], ["better-auth", "postgresql"],
  ["prisma", "postgresql"], ["prisma", "mysql"], ["prisma", "mongodb"], ["prisma", "nodejs"], ["drizzle", "postgresql"], ["drizzle", "mysql"],
  ["nextjs", "vercel"], ["nodejs", "railway"], ["redis", "railway"], ["postgresql", "railway"], ["docker", "railway"], ["docker", "nodejs"],
  ["pgvector", "postgresql"], ["langchain", "nodejs"], ["vercel-ai-sdk", "nextjs"], ["zod", "trpc"],
  ["ovunque", "front"], ["ovunque", "back"],
];

// I nodi che non scendono dal cartellino: «ovunque» attraversa tutte le zone,
// e appenderlo sotto una sola direbbe che serve solo a quella.
export const LOOSE: readonly string[] = ["ovunque"];

/** `to` al posto di `from`, con il perche' in messages. */
export type Alternative = { from: string; to: string };

export type Garment = {
  /** Anche la chiave di traduzione: cassetta.capi.<id>. */
  id: string;
  /** Slug degli attrezzi. */
  uses: readonly string[];
  /** Percentuale per scomparto: stime dichiarate, la pagina scrive «stima» accanto. */
  weight: Partial<Record<ZoneId, number>>;
  estimated: true;
  alt: readonly Alternative[];
};

export const GARMENTS: readonly Garment[] = [
  {
    id: "vetrina",
    uses: ["nextjs", "react", "tailwind", "gsap", "typescript", "vercel"],
    weight: { stili: 45, front: 35, casa: 15, ovunque: 5 },
    estimated: true,
    alt: [{ from: "gsap", to: "framer-motion" }],
  },
  {
    id: "ecommerce",
    uses: ["nextjs", "react", "tailwind", "shadcn-ui", "rest", "redis", "nodejs", "express", "authjs", "postgresql", "prisma", "zod", "vercel", "railway"],
    weight: { front: 20, back: 20, dati: 20, mezzo: 15, auth: 10, stili: 5, casa: 5, ovunque: 5 },
    estimated: true,
    alt: [
      { from: "postgresql", to: "mysql" },
      { from: "express", to: "nestjs" },
    ],
  },
  {
    id: "piattaforma",
    uses: ["nextjs", "react", "shadcn-ui", "trpc", "websocket", "redis", "nodejs", "nestjs", "clerk", "postgresql", "drizzle", "zod", "typescript", "vitest", "docker", "railway"],
    weight: { back: 25, front: 15, mezzo: 15, auth: 15, dati: 15, stili: 5, ovunque: 5, casa: 5 },
    estimated: true,
    alt: [
      { from: "clerk", to: "better-auth" },
      { from: "trpc", to: "graphql" },
    ],
  },
  {
    id: "assistente",
    uses: ["nextjs", "react", "vercel-ai-sdk", "langchain", "pgvector", "postgresql", "supabase-auth", "nodejs", "redis", "railway"],
    weight: { ai: 35, dati: 25, front: 10, back: 10, auth: 10, mezzo: 5, casa: 5 },
    estimated: true,
    alt: [{ from: "supabase-auth", to: "clerk" }],
  },
];
