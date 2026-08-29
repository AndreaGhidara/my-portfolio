import { getTranslations } from "next-intl/server";
import { SeekingView, type SeekingItem } from "./SeekingView";

/**
 * Gli stessi id dei servizi, e non e' un caso: ogni frase qui ha la sua
 * risposta nella sezione successiva, nello stesso ordine. Se un giorno le due
 * liste divergono, il sito fa una domanda a cui non risponde.
 */
const ITEM_IDS = ["sites", "ecommerce", "webapp", "ai"] as const;

export async function Seeking() {
  const t = await getTranslations("seeking");

  const items: SeekingItem[] = ITEM_IDS.map((id) => ({
    id,
    voice: t(`list.${id}.voice`),
  }));

  return (
    <SeekingView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      outro={t("outro")}
      items={items}
    />
  );
}
