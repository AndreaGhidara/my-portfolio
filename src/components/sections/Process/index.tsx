import { getTranslations } from "next-intl/server";
import { processDeliveries } from "@/content/process";
import { ProcessView, type ProcessDeliveryView } from "./ProcessView";

// Numerate e non un array: con gli array next-intl chiede `t.raw`, che
// rinuncia al controllo sulle chiavi mancanti.
const INCLUDE_KEYS = ["uno", "due", "tre"] as const;

export async function Process() {
  const t = await getTranslations("process");

  // Gli id vengono dal contenuto: due elenchi allineati a mano si
  // disallineano in silenzio, stampando una consegna in meno.
  const deliveries: ProcessDeliveryView[] = processDeliveries.map(({ id }) => ({
    id,
    when: t(`list.${id}.quando`),
    title: t(`list.${id}.titolo`),
    lead: t(`list.${id}.lead`),
    includes: INCLUDE_KEYS.map((k) => t(`list.${id}.dentro.${k}`)),
    excludes: t(`list.${id}.nonlo`),
    why: t(`list.${id}.perche`),
  }));

  return (
    <ProcessView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      deliveries={deliveries}
    />
  );
}
