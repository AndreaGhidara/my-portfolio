// GENERATO da scripts/build-works-shots.mjs con `npm run assets`: non si modifica a mano.
// Fuori da works.ts perche' misure e anteprima le decide il PNG, non la redazione.
export type WorkShot = {
  src: string;
  width: number;
  height: number;
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

// Meglio un errore che un dossier aperto su un riquadro rotto.
export function shotBySrc(src: string): WorkShot {
  const shot = workShots[src];
  if (!shot) {
    throw new Error(
      `Schermata sconosciuta: ${src}. Manca da assets-source/works, oppure non e' stato lanciato "npm run assets".`,
    );
  }
  return shot;
}
