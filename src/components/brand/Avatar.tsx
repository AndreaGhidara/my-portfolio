import Image from "next/image";
import { brandAssets } from "@/content/brand-assets";

// `alt` dal chiamante: il file dei marchi non sa la lingua della pagina, e su /en
// si leggeva italiano. Il suo valore resta solo come ripiego.
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
      /* L'88% di InkCircle, che e' 128px sotto i 1024px e 176px sopra (HeroView.tsx). */
      sizes="(min-width: 1024px) 155px, 113px"
      className={className}
    />
  );
}
