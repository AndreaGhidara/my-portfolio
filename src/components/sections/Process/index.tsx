import { getTranslations } from "next-intl/server";
import { processDeliveries } from "@/content/process";
import { ProcessView, type ProcessDeliveryView } from "./ProcessView";

/** Le tre cose che ogni consegna contiene. Numerate e non un array: con gli
 *  array next-intl chiede `t.raw`, che rinuncia al controllo sulle chiavi
 *  mancanti, e nel repo non lo usa nessuno. */
const DENTRO = ["uno", "due", "tre"] as const;

export async function Process() {
  const t = await getTranslations("process");

  // Gli id vengono dal contenuto e non da una lista qui: erano due elenchi da
  // tenere allineati a mano, ed e' il tipo di disallineamento che non rompe
  // niente: stampa solo una consegna in meno.
  const deliveries: ProcessDeliveryView[] = processDeliveries.map(({ id }) => ({
    id,
    when: t(`list.${id}.quando`),
    title: t(`list.${id}.titolo`),
    lead: t(`list.${id}.lead`),
    includes: DENTRO.map((k) => t(`list.${id}.dentro.${k}`)),
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
