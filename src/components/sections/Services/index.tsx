import { getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { deskLayers } from "@/content/desk";
import { metricById } from "@/content/metrics";
import { ServicesView } from "./ServicesView";
import type { DeskLayerData } from "./DeskTable";

export async function Services() {
  const t = await getTranslations("services");
  const tMetrics = await getTranslations("metrics");

  // Il numero sta in content/metrics.ts come tutti gli altri numeri inventati
  // del sito, l'unita' nelle traduzioni come tutte le altre etichette di
  // metrica: "caffe'" in inglese e' "coffees", e un campione scritto a mano nel
  // componente sarebbe l'unico del tavolo che non sa girare lingua.
  const caffe = metricById("coffees");

  const layers: DeskLayerData[] = deskLayers.map((layer) => ({
    id: layer.id,
    title: t(`layers.${layer.id}.title`),
    lead: t(`layers.${layer.id}.lead`),
    objects: layer.objects.map((object) => ({
      id: object.id,
      shape: object.shape,
      sample: object.sample,
      // Il post-it bianco e' muto: nessuna chiave da cercare, e cercarla
      // solleverebbe. Il buco nelle traduzioni e' voluto.
      label: object.mute ? null : t(`layers.${layer.id}.objects.${object.id}`),
    })),
  }));

  return (
    <ServicesView
      eyebrow={t("eyebrow")}
      stageTitle={t("stageTitle")}
      stageLead={t("stageLead")}
      centre={t("centre")}
      composto={t("composto")}
      blank={t("blank")}
      note={`${caffe.value} ${tMetrics(caffe.id)}`}
      punch={t("punch")}
      practice={t("practice")}
      intro={t("intro")}
      layers={layers}
      items={services.map((service) => ({
        id: service.id,
        title: t(`list.${service.id}.title`),
        description: t(`list.${service.id}.description`),
      }))}
    />
  );
}
