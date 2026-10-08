import { CATEGORIES } from "@/lib/news/types";
import type { NewsCopy } from "./types";

/** La `t` di next-intl sul namespace `notizie`: serve anche `raw`, per i modelli. */
type Traduci = { (chiave: string): string; raw(chiave: string): unknown };

/**
 * I testi della sezione dal namespace `notizie`. Sta fuori dal componente
 * server perche' le prove li costruiscono dagli stessi file di lingua, con lo
 * stesso codice: una chiave che manca si vede nei test.
 *
 * I modelli con le graffe passano crudi: li riempie la macchina, con valori
 * che il server non conosce (quante palline restano, a che ora sono arrivate).
 */
export function newsCopy(t: Traduci): NewsCopy {
  const modello = (chiave: string) => String(t.raw(chiave));
  return {
    categories: Object.fromEntries(
      CATEGORIES.map((c) => [c, { name: t(`categorie.${c}.nome`), masthead: t(`categorie.${c}.testata`) }]),
    ) as NewsCopy["categories"],
    stamps: {
      "prima-pagina": t("timbri.primaPagina"),
      paper: t("timbri.paper"),
      "piu-letto": t("timbri.piuLetto"),
      release: t("timbri.release"),
    },
    figures: {
      punti: t("dati.punti"),
      commenti: t("dati.commenti"),
      voti: t("dati.voti"),
      autori: t("dati.autori"),
      reazioni: t("dati.reazioni"),
      lettura: t("dati.lettura"),
      versione: t("dati.versione"),
    },
    minutes: modello("minuti"),
    release: modello("rilascio"),
    readOn: modello("leggiSu"),
    plate: modello("targa"),
    plateOne: modello("targaUna"),
    exhausted: modello("finite"),
    collectedToday: modello("raccolteOggi"),
    collectedOn: modello("raccolteIl"),
    group: t("gruppo"),
    knob: t("manopola"),
    help: t("aiuto"),
    waiting: t("attesa"),
    empty: t("vuota"),
    error: t("errore"),
    alreadyDrawn: t("giaUscite"),
    masthead: t("testata"),
    noneDrawn: t("nessunaUscita"),
    noSummary: t("senzaRiassunto"),
  };
}
