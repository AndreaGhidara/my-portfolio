import Image from "next/image";
import { brandAssets } from "@/content/brand-assets";

/**
 * `alt` arriva da chi disegna, non dal file dei marchi: quello e' un file di
 * dati e non sa in che lingua sta la pagina. Con il testo scritto li' dentro,
 * su /en uno screen reader leggeva italiano. Il valore del file resta come
 * ripiego per un eventuale chiamante che non lo passi.
 */
export function Avatar({
  className,
  priority = false,
  alt,
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  const asset = brandAssets.avatar;
  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      /* Renderizzato dentro InkCircle: size-32 (128px) sotto i 1024px,
         lg:size-44 (176px) da 1024px in su, al 88% (w-[88%]) di quel
         contenitore. Vedi HeroView.tsx per il markup. */
      sizes="(min-width: 1024px) 155px, 113px"
      className={className}
    />
  );
}
