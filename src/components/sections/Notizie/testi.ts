import { CATEGORIE } from "@/lib/notizie/tipi";
import type { TestiNotizie } from "./tipi";

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
export function testiNotizie(t: Traduci): TestiNotizie {
  const modello = (chiave: string) => String(t.raw(chiave));
  return {
    categorie: Object.fromEntries(
      CATEGORIE.map((c) => [c, { nome: t(`categorie.${c}.nome`), testata: t(`categorie.${c}.testata`) }]),
    ) as TestiNotizie["categorie"],
    timbri: {
      "prima-pagina": t("timbri.primaPagina"),
      paper: t("timbri.paper"),
      "piu-letto": t("timbri.piuLetto"),
      release: t("timbri.release"),
    },
    dati: {
      punti: t("dati.punti"),
      commenti: t("dati.commenti"),
      voti: t("dati.voti"),
      autori: t("dati.autori"),
      reazioni: t("dati.reazioni"),
      lettura: t("dati.lettura"),
      versione: t("dati.versione"),
    },
    minuti: modello("minuti"),
    rilascio: modello("rilascio"),
    leggiSu: modello("leggiSu"),
    targa: modello("targa"),
    targaUna: modello("targaUna"),
    finite: modello("finite"),
    raccolteOggi: modello("raccolteOggi"),
    raccolteIl: modello("raccolteIl"),
    gruppo: t("gruppo"),
    manopola: t("manopola"),
    aiuto: t("aiuto"),
    attesa: t("attesa"),
    vuota: t("vuota"),
    errore: t("errore"),
    giaUscite: t("giaUscite"),
    testata: t("testata"),
    nessunaUscita: t("nessunaUscita"),
    senzaRiassunto: t("senzaRiassunto"),
  };
}
