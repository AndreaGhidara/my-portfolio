/**
 * GENERATO da scripts/build-works-shots.mjs. Non si modifica a mano:
 * `npm run assets` lo riscrive.
 *
 * Misure e anteprima sfocata delle schermate. Stanno qui e non in works.ts
 * perche' non sono contenuto: works.ts dichiara SE un caso ha una schermata,
 * che e' una decisione editoriale; quanto e' alta e di che colore e' sfocata
 * lo decide il file PNG, e va riscritto ogni volta che il file cambia.
 */
export type WorkShot = {
  src: string;
  width: number;
  height: number;
  /** LQIP a 20px in base64: l'anteprima che riempie il riquadro
   *  prima che la schermata vera arrivi. */
  blurDataURL: string;
};

export const workShots: Record<string, WorkShot> = {
  "/works/aidify.webp": {
    src: "/works/aidify.webp",
    width: 1600,
    height: 774,
    blurDataURL:
      "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAADQAwCdASoUAAoAPu1iqU2ppaOiMAgBMB2JZADE2CG5AkwPIiZl8oAA/u9nAN0I4KGJJQpx7cpMXFoV9mtCoJcs4R7/D6U/BeG3oO+Wm30netKqfTXW+F4S87nyKTM1f5xyGv1RQc7gKSy3AAA=",
  },
  "/works/bdroppy.webp": {
    src: "/works/bdroppy.webp",
    width: 1600,
    height: 776,
    blurDataURL:
      "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAADQAwCdASoUAAoAPu1iqU2ppaQiMAgBMB2JaACdACHoa6npgksSckAA/urw2UQ60MQUkfSmXRplnx/fs03HuC9WIxYQi1BSXWwegUzKAdrOmneM1CwxT4fIGn6eLbiv/glAAA==",
  },
  "/works/visualboost.webp": {
    src: "/works/visualboost.webp",
    width: 1600,
    height: 776,
    blurDataURL:
      "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAADwAwCdASoUAAoAPu1mqk2ppaQiMAgBMB2JaAAAWq2nUQ5kV9HQXjMgAP7vxHCCdtbthCT531VuWeN8qapHjeaPFsTk7be+C8khUg2JQBKTYfb2Canc571xlrG+vHWIzzxk5aUYc9mSAAAA",
  },
};

/**
 * Lancia se la schermata non e' nel manifesto: vuol dire che works.ts punta a
 * un file che non e' mai stato generato, e in quel caso il dossier si aprirebbe
 * su un riquadro rotto. Meglio che non compili.
 */
export function shotBySrc(src: string): WorkShot {
  const shot = workShots[src];
  if (!shot) {
    throw new Error(
      `Schermata sconosciuta: ${src}. Manca da assets-source/works, oppure non e' stato lanciato "npm run assets".`,
    );
  }
  return shot;
}
