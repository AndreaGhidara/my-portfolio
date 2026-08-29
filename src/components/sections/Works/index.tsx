import { getTranslations } from "next-intl/server";
import { works } from "@/content/works";
import { metricById } from "@/content/metrics";
import { WorksView } from "./WorksView";
import type { WorkCaseData } from "./WorkCase";

export async function Works() {
  const t = await getTranslations("works");
  const tMetrics = await getTranslations("metrics");

  const items: WorkCaseData[] = works.map((work) => ({
    id: work.id,
    name: t(`list.${work.id}.name`),
    symptom: t(`list.${work.id}.symptom`),
    decision: t(`list.${work.id}.decision`),
    outcome: t(`list.${work.id}.outcome`),
    url: work.url,
    screenshot: work.screenshot,
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
        symptom: t("labels.symptom"),
        decision: t("labels.decision"),
        outcome: t("labels.outcome"),
        visit: t("labels.visit"),
        open: t("labels.open"),
        close: t("labels.close"),
      }}
      items={items}
    />
  );
}
