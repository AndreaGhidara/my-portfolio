import { getLocale, getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { ReceiptView } from "./ReceiptView";
import type { PrintableService } from "./ReceiptPrinter";

/**
 * I servizi sono gli stessi del tavolo piu' sotto (content/services.ts e
 * services.list): qui si stampano, li' si montano. Nessuna copia dei testi.
 */
export async function Receipt() {
  const t = await getTranslations("scontrino");
  const tServizi = await getTranslations("services");
  // La data dello scontrino la scrive il browser, nella lingua della pagina:
  // qui si passa solo la lingua, perche' la data del server e' quella della build.
  const locale = await getLocale();

  const servizi: PrintableService[] = services.map((service) => {
    const titolo = tServizi(`list.${service.id}.title`);
    const pezzi = service.pieces.map((pezzo) => tServizi(`list.${service.id}.pezzi.${pezzo}`));
    return {
      id: service.id,
      title: titolo,
      text: tServizi(`list.${service.id}.description`),
      pieces: pezzi,
      drawing: t("disegno", { titolo, pezzi: pezzi.join(", ") }),
    };
  });

  return (
    <ReceiptView
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
      locale={locale}
      services={servizi}
      copy={{
        hint: t("hint"),
        keys: t("tasti"),
        brand: t("marca"),
        name: t("nome"),
        trade: t("mestiere"),
        number: t("numero"),
        total: t("totale"),
        toDiscuss: t("daParlarne"),
        letsTalk: t("parliamone"),
        tear: t("strappa"),
        plate: t("tavola"),
        scale: t("scala"),
        signature: t("firma"),
      }}
    />
  );
}
