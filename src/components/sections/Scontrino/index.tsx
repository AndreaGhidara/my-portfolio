import { getLocale, getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { ScontrinoView } from "./ScontrinoView";
import type { ServizioStampabile } from "./ScontrinoStampante";

/**
 * I servizi sono gli stessi del tavolo piu' sotto (content/services.ts e
 * services.list): qui si stampano, li' si montano. Nessuna copia dei testi.
 */
export async function Scontrino() {
  const t = await getTranslations("scontrino");
  const tServizi = await getTranslations("services");
  // La data dello scontrino la scrive il browser, nella lingua della pagina:
  // qui si passa solo la lingua, perche' la data del server e' quella della build.
  const locale = await getLocale();

  const servizi: ServizioStampabile[] = services.map((service) => {
    const titolo = tServizi(`list.${service.id}.title`);
    const pezzi = service.pezzi.map((pezzo) => tServizi(`list.${service.id}.pezzi.${pezzo}`));
    return {
      id: service.id,
      titolo,
      testo: tServizi(`list.${service.id}.description`),
      pezzi,
      disegno: t("disegno", { titolo, pezzi: pezzi.join(", ") }),
    };
  });

  return (
    <ScontrinoView
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
      locale={locale}
      servizi={servizi}
      testi={{
        hint: t("hint"),
        tasti: t("tasti"),
        marca: t("marca"),
        nome: t("nome"),
        mestiere: t("mestiere"),
        numero: t("numero"),
        totale: t("totale"),
        daParlarne: t("daParlarne"),
        parliamone: t("parliamone"),
        strappa: t("strappa"),
        tavola: t("tavola"),
        scala: t("scala"),
        firma: t("firma"),
      }}
    />
  );
}
