import { getTranslations } from "next-intl/server";
import { works } from "@/content/works";
import { metricById } from "@/content/metrics";
import { shotBySrc } from "@/content/works-shots";
import { WorksView } from "./WorksView";
import type { WorkCaseData } from "./types";

export async function Works() {
  const t = await getTranslations("works");
  const tMetrics = await getTranslations("metrics");

  const items: WorkCaseData[] = works.map((work) => ({
    id: work.id,
    name: t(`list.${work.id}.name`),
    riga: t(`list.${work.id}.riga`),
    lavoro: t(`list.${work.id}.lavoro`),
    scelta: t(`list.${work.id}.scelta`),
    conduzione: t(`list.${work.id}.conduzione`),
    url: work.url,
    screenshot: work.screenshot ? shotBySrc(work.screenshot) : undefined,
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
        lavoro: t("labels.lavoro"),
        scelta: t("labels.scelta"),
        conduzione: t("labels.conduzione"),
        visit: t("labels.visit"),
        riservato: t("labels.riservato"),
        open: t("labels.open"),
        close: t("labels.close"),
      }}
      items={items}
    />
  );
}
