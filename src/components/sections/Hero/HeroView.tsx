import { Avatar } from "@/components/brand/Avatar";
import { InkCircle } from "@/components/brand/InkCircle";
import { WebCorner } from "@/components/brand/WebCorner";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { HeroMotion } from "./HeroMotion";

export type HeroViewProps = {
  eyebrow: string;
  wordmarkAlt: string;
  claim: string;
  subclaim: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scrollHint: string;
};

export function HeroView({
  eyebrow, wordmarkAlt, claim, subclaim, ctaPrimary, ctaSecondary, scrollHint,
}: HeroViewProps) {
  return (
    <section id="hero" className="relative overflow-hidden px-[var(--gutter)] pb-16 pt-6">
      <WebCorner className="pointer-events-none absolute -left-6 -top-6 block w-32 lg:w-52" />
      <ThreadSegment section="hero" className="pointer-events-none absolute inset-0 -z-10" />

      <HeroMotion>
        <p className="eyebrow">{eyebrow}</p>

        {/* Il nome a filo dei bordi: e' la differenza fra il prototipo
            composto e la versione che ferma qualcuno. */}
        <h1 className="mt-4 flex justify-between gap-[1px]">
          <Wordmark
            text="ANDREA"
            label={wordmarkAlt}
            className="flex w-full justify-between gap-[1px] [&>img]:h-auto [&>img]:w-[15.5%]"
          />
        </h1>

        <div data-hero-avatar className="relative z-10 -mt-[6%] flex justify-center">
          <InkCircle className="relative grid size-32 place-items-center lg:size-44">
            <Avatar className="relative z-10 w-[88%]" />
          </InkCircle>
        </div>

        <div data-hero-copy className="mx-auto mt-6 max-w-xl text-center">
          <p className="text-xl font-semibold text-[var(--fg)] lg:text-2xl">{claim}</p>
          <p className="mt-3 text-[var(--fg-muted)]">{subclaim}</p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#contact"
              className="rounded-full bg-[var(--fg)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--bg)]"
            >
              {ctaPrimary}
            </a>
            <a
              href="#works"
              className="rounded-full border-2 border-[var(--fg)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--fg)]"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>
      </HeroMotion>

      <p className="eyebrow mt-10 text-center">{scrollHint}</p>
    </section>
  );
}
