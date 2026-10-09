import { getTranslations } from "next-intl/server";
import { deskLayers } from "@/content/desk";
import { metricById } from "@/content/metrics";
import { ServicesView } from "./ServicesView";
import type { DeskLayerData } from "./DeskTable";
import { toolboxCopy } from "./toolbox/copy";

export async function Services() {
  const t = await getTranslations("services");
  const tMetrics = await getTranslations("metrics");
  const tc = await getTranslations("cassetta");

  // Numero inventato da content/metrics.ts, unita' dalle traduzioni: scritto
  // qui sarebbe l'unico testo del tavolo che non cambia lingua.
  const coffees = metricById("coffees");

  const layers: DeskLayerData[] = deskLayers.map((layer) => ({
    id: layer.id,
    title: t(`layers.${layer.id}.title`),
    lead: t(`layers.${layer.id}.lead`),
    objects: layer.objects.map((object) => ({
      id: object.id,
      shape: object.shape,
      sample: object.sample,
      // Il post-it bianco non ha chiave: cercarla solleverebbe.
      label: object.mute ? null : t(`layers.${layer.id}.objects.${object.id}`),
    })),
  }));

  const copy = toolboxCopy(tc);

  return (
    <ServicesView
      eyebrow={t("eyebrow")}
      stageTitle={t("stageTitle")}
      stageLead={t("stageLead")}
      centre={t("centre")}
      blank={t("blank")}
      note={`${coffees.value} ${tMetrics(coffees.id)}`}
      punch={t("punch")}
      layers={layers}
      toolbox={{
        eyebrow: tc("eyebrow"),
        title: tc("title"),
        lead: tc("lead"),
        copy,
      }}
    />
  );
}
