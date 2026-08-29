import Image from "next/image";
import { letterFor } from "@/content/brand-assets";

type WordmarkProps = {
  /** La parola da comporre. Ogni carattere deve esistere nel registro. */
  text: string;
  /** Come lo legge uno screen reader. */
  label: string;
  className?: string;
  /** Da attivare solo nell'hero: è l'elemento LCP della pagina. */
  priority?: boolean;
};

/**
 * La parola è fatta di immagini, quindi il nome deve esistere come testo
 * accessibile: role="img" più aria-label sul contenitore, alt vuoto sulle
 * singole lettere. Senza questo uno screen reader legge il nulla.
 */
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
            /* Ogni lettera occupa il 15,5% della larghezza del contenuto
               (sezione a piena larghezza meno 2 * --gutter): 1,25rem/20px
               di gutter sotto i 1024px, 2,5rem/40px da 1024px in su.
               Vedi HeroView.tsx per il markup che genera questa percentuale. */
            sizes="(min-width: 1024px) calc(15.5vw - 12.4px), calc(15.5vw - 6.2px)"
            data-letter={char.toLowerCase()}
            className="wordmark-letter"
          />
        );
      })}
    </span>
  );
}
