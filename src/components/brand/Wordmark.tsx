import Image from "next/image";
import { letterFor } from "@/content/brand-assets";

type WordmarkProps = {
  // Ogni carattere deve esistere nel registro delle lettere.
  text: string;
  label: string;
  className?: string;
  // Solo nell'hero: e' l'elemento LCP della pagina.
  priority?: boolean;
};

export function Wordmark({ text, label, className, priority = false }: WordmarkProps) {
  const letters = Array.from(text);

  return (
    <span role="img" aria-label={label} className={className}>
      {letters.map((char, index) => {
        const asset = letterFor(char);
        return (
          <Image
            key={`${char}-${index}`}
            src={asset.src}
            alt=""
            width={asset.width}
            height={asset.height}
            priority={priority}
            /* Il 15,5% della larghezza meno 2 * --gutter (20px sotto i 1024px,
               40px sopra): il markup e' in HeroView.tsx. */
            sizes="(min-width: 1024px) calc(15.5vw - 12.4px), calc(15.5vw - 6.2px)"
            data-letter={char.toLowerCase()}
            className="wordmark-letter"
          />
        );
      })}
    </span>
  );
}
