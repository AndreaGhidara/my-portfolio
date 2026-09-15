import { getTranslations } from "next-intl/server";
import { seekingRoutes } from "@/content/seeking";
import { SeekingView } from "./SeekingView";
import type { SeekingMail } from "./SeekingCasella";

/**
 * Le cinque strade non ricalcano gli id dei servizi, e non rimandano piu' a
 * nessun lavoro: la mail si chiude su una sola uscita, i contatti. Vedi
 * content/seeking.ts per il perche'.
 *
 * `seekingRoutes` tiene soltanto l'ordine, che e' la decisione: quanto ogni
 * intervento tocca di quello che uno ha gia'. Tutto il resto e' nei testi.
 */
export async function Seeking() {
  const t = await getTranslations("seeking");

  const mail: SeekingMail[] = seekingRoutes.map((r) => ({
    id: r.id,
    nome: t(`list.${r.id}.nome`),
    oggetto: t(`list.${r.id}.oggetto`),
    anteprima: t(`list.${r.id}.anteprima`),
    et: t(`list.${r.id}.et`),
    titolo: t(`list.${r.id}.titolo`),
    etPrima: t(`list.${r.id}.etPrima`),
    prima: t(`list.${r.id}.prima`),
    tipo: t(`list.${r.id}.tipo`),
    cta: t(`list.${r.id}.cta`),
  }));

  return (
    <SeekingView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      etichettaTipo={t("labels.tipo")}
      casella={{
        etichettaDa: t("casella.etichettaDa"),
        etichettaA: t("casella.etichettaA"),
        da: t("casella.da"),
        a: t("casella.a"),
        vuoto: t("casella.vuoto"),
        firma: t("casella.firma"),
        ruolo: t("casella.ruolo"),
      }}
      mail={mail}
    />
  );
}
