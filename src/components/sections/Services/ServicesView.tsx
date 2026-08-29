import { Reveal } from "@/animations/components/Reveal";
import { QuoteFrame } from "@/components/brand/QuoteFrame";
import { ThreadSegment } from "@/components/thread/ThreadSegment";

export type ServiceItem = { id: string; title: string; description: string };

export type ServicesViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  items: ServiceItem[];
};

export function ServicesView({ eyebrow, title, intro, items }: ServicesViewProps) {
  return (
    <section
      id="services"
      className="relative bg-[var(--accent)] px-[var(--gutter)] py-[var(--section-y)]"
    >
      <ThreadSegment section="services" className="pointer-events-none absolute inset-0 opacity-40" />

      {/* Le virgolette aprono e chiudono davvero il blocco. */}
      <QuoteFrame variant="open" className="absolute left-4 top-4 block w-20 lg:w-32 [&_img]:h-auto [&_img]:w-full [&_img]:brightness-0 [&_img]:invert" />

      <div className="relative mx-auto max-w-4xl pt-16">
        <p className="eyebrow !text-[var(--on-accent)] opacity-70">{eyebrow}</p>
        {/* Carta su arancio: 3,3:1, ammesso solo perche' e' testo grande. */}
        <h2 className="mt-3 text-4xl text-[var(--paper)] lg:text-6xl">{title}</h2>
        {/* Testo corrente sull'arancio: deve essere inchiostro (5,1:1),
            mai carta (3,3:1). E' il vincolo di contrasto della spec. */}
        <p data-service-description className="mt-4 max-w-2xl text-[var(--on-accent)]">
          {intro}
        </p>

        <Reveal className="mt-10 grid gap-4 sm:grid-cols-2" stagger={0.09}>
          {items.map((item, index) => (
            <article key={item.id} className="rounded-[var(--radius)] bg-[var(--paper)] p-6">
              <span className="eyebrow !text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-xl font-bold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
            </article>
          ))}
        </Reveal>
      </div>

      <QuoteFrame variant="close" className="absolute -bottom-6 left-4 block w-12 lg:w-16 [&_img]:h-auto [&_img]:w-full [&_img]:brightness-0 [&_img]:invert" />
    </section>
  );
}
