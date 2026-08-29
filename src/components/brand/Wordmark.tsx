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
            data-letter={char.toLowerCase()}
            className="wordmark-letter"
          />
        );
      })}
    </span>
  );
}
