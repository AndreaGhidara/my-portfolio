import { CATEGORIES } from "@/lib/news/types";
import type { NewsCopy } from "./types";

/** La `t` di next-intl sul namespace `notizie`: serve anche `raw`, per i modelli. */
type Translate = { (key: string): string; raw(key: string): unknown };

// Fuori dal componente server perche' i test costruiscano i testi dagli stessi
// file di lingua: una chiave che manca si vede nei test. I modelli con le graffe
// passano crudi: li riempie il client, con valori che il server non conosce.
export function newsCopy(t: Translate): NewsCopy {
  const template = (key: string) => String(t.raw(key));
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
    minutes: template("minuti"),
    release: template("rilascio"),
    readOn: template("leggiSu"),
    plate: template("targa"),
    plateOne: template("targaUna"),
    exhausted: template("finite"),
    collectedToday: template("raccolteOggi"),
    collectedOn: template("raccolteIl"),
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
