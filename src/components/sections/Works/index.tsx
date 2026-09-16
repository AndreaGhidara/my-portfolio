import { getTranslations } from "next-intl/server";
import { works } from "@/content/works";
import { metricById } from "@/content/metrics";
import { WorksView } from "./WorksView";
import type { WorkCaseData } from "./types";

export async function Works() {
  const t = await getTranslations("works");
  const tMetrics = await getTranslations("metrics");

  const items: WorkCaseData[] = works.map((work) => ({
    id: work.id,
    name: t(`list.${work.id}.name`),
    symptom: t(`list.${work.id}.symptom`),
    alternativa: t(`list.${work.id}.alternativa`),
    perche: t(`list.${work.id}.perche`),
    fatto: t(`list.${work.id}.fatto`),
    url: work.url,
    screenshot: work.screenshot,
    screenshotAlt: t("labels.screenshotAlt", { name: t(`list.${work.id}.name`) }),
    year: work.year,
    tech: work.tech,
    metrics: work.metricIds.map((id) => {
      const metric = metricById(id);
      return { id: metric.id, value: metric.value, label: tMetrics(metric.id) };
    }),
  }));

  return (
    <WorksView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      labels={{
        alternativa: t("labels.alternativa"),
        perche: t("labels.perche"),
        fatto: t("labels.fatto"),
        visit: t("labels.visit"),
        riservato: t("labels.riservato"),
        open: t("labels.open"),
        close: t("labels.close"),
      }}
      items={items}
    />
  );
}
