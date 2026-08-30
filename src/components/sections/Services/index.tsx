import { getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { deskLayers } from "@/content/desk";
import { ServicesView } from "./ServicesView";
import type { DeskLayerData } from "./DeskTable";

export async function Services() {
  const t = await getTranslations("services");

  const layers: DeskLayerData[] = deskLayers.map((layer) => ({
    id: layer.id,
    title: t(`layers.${layer.id}.title`),
    lead: t(`layers.${layer.id}.lead`),
    objects: layer.objects.map((object) => ({
      id: object.id,
      shape: object.shape,
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
      blank={t("blank")}
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
