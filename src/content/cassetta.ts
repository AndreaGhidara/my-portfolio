/**
 * La cassetta del sarto: tutto quello che so usare, diviso per scomparti, e i
 * capi, cioe' cosa ne prenderei per un tipo di lavoro. Niente testo qui: nomi
 * degli scomparti, descrizioni e perche' stanno in messages, sotto `cassetta`.
 * I nomi degli attrezzi invece sono dati, perche' sono marchi e non si
 * traducono.
 *
 * Le coordinate sono quelle della mappa del prototipo
 * (docs/prototipi/2026-09-27-cassetta-sarto.html), in unita' di un viewBox
 * 1200 x 820. I collegamenti sono quelli della versione rivista del
 * 2026-09-27: fratelli dove prima c'era una catena, figli dove uno gira
 * sull'altro.
 */

export type ZonaId = "front" | "stili" | "mezzo" | "back" | "auth" | "dati" | "casa" | "ovunque" | "ai";

export type Zona = {
  id: ZonaId;
  /** Il rettangolo della pezza: x, y, larghezza, altezza. */
  r: readonly [number, number, number, number];
};

/**
 * L'ordine e' quello dell'editor e dell'elenco: prima quello che si vede, poi
 * quello che sta sotto, e in fondo cio' che attraversa tutto.
 */
export const ZONE: readonly Zona[] = [
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

/**
 * Dove l'attrezzo e' stato usato davvero. `lavoro` se compare nei lavori, nel
 * CV, nella scheda del colloquio o in questo sito; altrimenti `conosciuto`:
 * lo so usare, ma nessun lavoro lo prova. L'etichetta lo dice, perche' una
 * cassetta che non distingue le due cose promette piu' di quello che ha.
 */
export type Provato = "lavoro" | "conosciuto";

export type Attrezzo = {
  /** Lo slug: e' anche la chiave di traduzione, cassetta.attrezzi.<id>. */
  id: string;
  /** Il nome come si scrive: e' un marchio, non si traduce. */
  nome: string;
  zona: ZonaId;
  x: number;
  y: number;
  provato: Provato;
};

export const ATTREZZI: readonly Attrezzo[] = [
  { id: "nextjs", nome: "Next.js", zona: "front", x: 150, y: 250, provato: "lavoro" },
  { id: "react", nome: "React", zona: "front", x: 330, y: 250, provato: "lavoro" },
  { id: "tailwind", nome: "Tailwind CSS", zona: "stili", x: 120, y: 420, provato: "lavoro" },
  // Questo sito e' montato con shadcn/ui (components.json), e Radix sta sotto.
  { id: "shadcn-ui", nome: "shadcn/ui", zona: "stili", x: 250, y: 420, provato: "lavoro" },
  { id: "gsap", nome: "GSAP", zona: "stili", x: 365, y: 420, provato: "lavoro" },
  { id: "framer-motion", nome: "Framer Motion", zona: "stili", x: 150, y: 470, provato: "conosciuto" },
  { id: "radix", nome: "Radix", zona: "stili", x: 330, y: 470, provato: "lavoro" },
  { id: "graphql", nome: "GraphQL", zona: "mezzo", x: 600, y: 250, provato: "lavoro" },
  { id: "rest", nome: "REST", zona: "mezzo", x: 530, y: 320, provato: "lavoro" },
  { id: "trpc", nome: "tRPC", zona: "mezzo", x: 670, y: 320, provato: "conosciuto" },
  { id: "redis", nome: "Redis", zona: "mezzo", x: 600, y: 410, provato: "conosciuto" },
  // Nella scheda del colloquio c'e' come scelta ragionata (la 83), non come
  // lavoro consegnato: la regola dice «compare», e compare.
  { id: "websocket", nome: "WebSocket", zona: "mezzo", x: 600, y: 470, provato: "lavoro" },
  { id: "nodejs", nome: "Node.js", zona: "back", x: 850, y: 250, provato: "lavoro" },
  { id: "express", nome: "Express", zona: "back", x: 960, y: 250, provato: "lavoro" },
  { id: "nestjs", nome: "NestJS", zona: "back", x: 1075, y: 250, provato: "conosciuto" },
  { id: "clerk", nome: "Clerk", zona: "auth", x: 830, y: 420, provato: "conosciuto" },
  { id: "authjs", nome: "Auth.js", zona: "auth", x: 960, y: 420, provato: "conosciuto" },
  // Supabase c'e' nel CV e nei lavori, i suoi accessi no: meglio dire meno.
  { id: "supabase-auth", nome: "Supabase Auth", zona: "auth", x: 1085, y: 420, provato: "conosciuto" },
  { id: "better-auth", nome: "Better Auth", zona: "auth", x: 880, y: 470, provato: "conosciuto" },
  { id: "jwt", nome: "JWT", zona: "auth", x: 1040, y: 470, provato: "lavoro" },
  { id: "postgresql", nome: "PostgreSQL", zona: "dati", x: 370, y: 625, provato: "lavoro" },
  { id: "mysql", nome: "MySQL", zona: "dati", x: 480, y: 625, provato: "conosciuto" },
  { id: "mongodb", nome: "MongoDB", zona: "dati", x: 590, y: 625, provato: "conosciuto" },
  { id: "prisma", nome: "Prisma", zona: "dati", x: 715, y: 625, provato: "conosciuto" },
  { id: "drizzle", nome: "Drizzle", zona: "dati", x: 830, y: 625, provato: "conosciuto" },
  { id: "vercel", nome: "Vercel", zona: "casa", x: 420, y: 760, provato: "lavoro" },
  { id: "railway", nome: "Railway", zona: "casa", x: 600, y: 760, provato: "lavoro" },
  { id: "docker", nome: "Docker", zona: "casa", x: 780, y: 760, provato: "conosciuto" },
  { id: "typescript", nome: "TypeScript", zona: "ovunque", x: 155, y: 630, provato: "lavoro" },
  { id: "git", nome: "Git", zona: "ovunque", x: 100, y: 690, provato: "lavoro" },
  { id: "vitest", nome: "Vitest", zona: "ovunque", x: 210, y: 690, provato: "lavoro" },
  { id: "zod", nome: "Zod", zona: "ovunque", x: 155, y: 750, provato: "lavoro" },
  { id: "langchain", nome: "LangChain", zona: "ai", x: 1045, y: 630, provato: "lavoro" },
  { id: "vercel-ai-sdk", nome: "Vercel AI SDK", zona: "ai", x: 1045, y: 690, provato: "conosciuto" },
  { id: "pgvector", nome: "pgvector", zona: "ai", x: 1045, y: 750, provato: "conosciuto" },
];

/** Il cartellino in cima: il capo finito, da cui scende tutto. */
export const RADICE = { id: "sito", x: 600, y: 62 } as const;

/**
 * Gli snodi dei rami, uno per scomparto: l'id e' quello dello scomparto. Non
 * sono attrezzi: sono il punto da cui i rami di una zona si aprono.
 */
export const SNODI: readonly { id: ZonaId; x: number; y: number }[] = [
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

/** I rami dell'albero, dal padre al figlio. Ogni nodo ha un padre solo: il primo. */
export const RAMI: readonly (readonly [string, string])[] = [
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

/**
 * Gli incroci fra scomparti, tratteggiati: chi parla con chi senza stargli
 * sotto. «Ovunque» non ha un padre nell'albero, e i suoi due incroci sono il
 * modo in cui si attacca al resto (vedi SCIOLTI).
 */
export const INCROCI: readonly (readonly [string, string])[] = [
  ["nextjs", "graphql"], ["nextjs", "trpc"], ["react", "rest"], ["graphql", "nestjs"], ["rest", "express"], ["trpc", "nodejs"],
  ["redis", "nodejs"], ["websocket", "nodejs"], ["tailwind", "shadcn-ui"], ["framer-motion", "react"],
  ["nextjs", "authjs"], ["nextjs", "clerk"], ["jwt", "express"], ["supabase-auth", "postgresql"], ["better-auth", "postgresql"],
  ["prisma", "postgresql"], ["prisma", "mysql"], ["prisma", "mongodb"], ["prisma", "nodejs"], ["drizzle", "postgresql"], ["drizzle", "mysql"],
  ["nextjs", "vercel"], ["nodejs", "railway"], ["redis", "railway"], ["postgresql", "railway"], ["docker", "railway"], ["docker", "nodejs"],
  ["pgvector", "postgresql"], ["langchain", "nodejs"], ["vercel-ai-sdk", "nextjs"], ["zod", "trpc"],
  ["ovunque", "front"], ["ovunque", "back"],
];

/**
 * I nodi che non scendono dal cartellino, dichiarati: «ovunque» attraversa
 * tutte le zone, e appenderlo sotto una sola vorrebbe dire che le serve.
 * Ci si arriva dagli incroci. I suoi attrezzi scendono da lui.
 */
export const SCIOLTI: readonly string[] = ["ovunque"];

/** Un'alternativa: `a` al posto di `da`, con il perche' in messages. */
export type Alternativa = { da: string; a: string };

export type Capo = {
  /** Anche la chiave di traduzione: cassetta.capi.<id>. */
  id: string;
  /** Gli attrezzi che prenderei, per slug. */
  usa: readonly string[];
  /**
   * Quanto pesa ogni scomparto in questo lavoro, in percentuale: e' la
   * composizione dell'etichetta, come le fibre di un tessuto. Sono stime di chi
   * costruisce, e lo dichiarano: la pagina scrive «stima» accanto.
   */
  peso: Partial<Record<ZonaId, number>>;
  stimato: true;
  alt: readonly Alternativa[];
};

/**
 * Per ogni tipo di lavoro, gli attrezzi che prenderei dalla cassetta, e
 * l'alternativa che terrei pronta. E' un punto di partenza, non una ricetta
 * fissa, e la pagina lo dice.
 */
export const CAPI: readonly Capo[] = [
  {
    id: "vetrina",
    usa: ["nextjs", "react", "tailwind", "gsap", "typescript", "vercel"],
    peso: { stili: 45, front: 35, casa: 15, ovunque: 5 },
    stimato: true,
    alt: [{ da: "gsap", a: "framer-motion" }],
  },
  {
    id: "ecommerce",
    usa: ["nextjs", "react", "tailwind", "shadcn-ui", "rest", "redis", "nodejs", "express", "authjs", "postgresql", "prisma", "zod", "vercel", "railway"],
    peso: { front: 20, back: 20, dati: 20, mezzo: 15, auth: 10, stili: 5, casa: 5, ovunque: 5 },
    stimato: true,
    alt: [
      { da: "postgresql", a: "mysql" },
      { da: "express", a: "nestjs" },
    ],
  },
  {
    id: "piattaforma",
    usa: ["nextjs", "react", "shadcn-ui", "trpc", "websocket", "redis", "nodejs", "nestjs", "clerk", "postgresql", "drizzle", "zod", "typescript", "vitest", "docker", "railway"],
    peso: { back: 25, front: 15, mezzo: 15, auth: 15, dati: 15, stili: 5, ovunque: 5, casa: 5 },
    stimato: true,
    alt: [
      { da: "clerk", a: "better-auth" },
      { da: "trpc", a: "graphql" },
    ],
  },
  {
    id: "assistente",
    usa: ["nextjs", "react", "vercel-ai-sdk", "langchain", "pgvector", "postgresql", "supabase-auth", "nodejs", "redis", "railway"],
    peso: { ai: 35, dati: 25, front: 10, back: 10, auth: 10, mezzo: 5, casa: 5 },
    stimato: true,
    alt: [{ da: "supabase-auth", a: "clerk" }],
  },
];
