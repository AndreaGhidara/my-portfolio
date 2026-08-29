import Image from "next/image";
import { brandAssets } from "@/content/brand-assets";

export function Avatar({ className, priority = false }: { className?: string; priority?: boolean }) {
  const asset = brandAssets.avatar;
  return (
    <Image
      src={asset.src}
      alt={asset.alt}
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
