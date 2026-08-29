export type BrandAsset = {
  src: string;
  width: number;
  height: number;
  /** Vuoto per gli elementi decorativi: il significato è già nel testo accanto. */
  alt: string;
};

const letter = (char: string, width: number, height: number): BrandAsset => ({
  src: `/brand/letters/${char}.webp`,
  width,
  height,
  alt: "",
});

export const brandAssets = {
  letters: {
    a: letter("a", 600, 600),
    n: letter("n", 600, 600),
    d: letter("d", 600, 600),
    r: letter("r", 600, 600),
    e: letter("e", 600, 600),
  },
  quoteOpen: { src: "/brand/quote-open.webp", width: 900, height: 900, alt: "" },
  quoteClose: { src: "/brand/quote-close.webp", width: 500, height: 500, alt: "" },
  inkCircle: { src: "/brand/ink-circle.webp", width: 480, height: 480, alt: "" },
  avatar: {
    src: "/brand/avatar.webp",
    width: 480,
    height: 480,
    alt: "Ritratto illustrato di Andrea Ghidara",
  },
  webCorner: { src: "/brand/web-corner.svg", width: 400, height: 400, alt: "" },
} as const;

export type LetterKey = keyof typeof brandAssets.letters;

/** Risolve un carattere nella sua lettera timbrata. Solleva se non esiste. */
export function letterFor(char: string): BrandAsset {
  const key = char.toLowerCase() as LetterKey;
  const asset = brandAssets.letters[key];
  if (!asset) {
    throw new Error(
      `Nessuna lettera disponibile per "${char}". Aggiungila in assets-source/ e in brandAssets.letters.`,
    );
  }
  return asset;
}
