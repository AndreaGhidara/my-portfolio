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
  const tServices = await getTranslations("services");
  // La data dello scontrino la scrive il browser, nella lingua della pagina:
  // qui si passa solo la lingua, perche' la data del server e' quella della build.
  const locale = await getLocale();

  const printable: PrintableService[] = services.map((service) => {
    const title = tServices(`list.${service.id}.title`);
    const pieces = service.pieces.map((piece) => tServices(`list.${service.id}.pezzi.${piece}`));
    return {
      id: service.id,
      title,
      text: tServices(`list.${service.id}.description`),
      pieces,
      drawing: t("disegno", { titolo: title, pezzi: pieces.join(", ") }),
    };
  });

  return (
    <ReceiptView
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
      locale={locale}
      services={printable}
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
