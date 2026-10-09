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
    tagline: t(`list.${work.id}.riga`),
    work: t(`list.${work.id}.lavoro`),
    choice: t(`list.${work.id}.scelta`),
    approach: t(`list.${work.id}.conduzione`),
    url: work.url,
    screenshot: work.screenshot ? shotBySrc(work.screenshot) : undefined,
    screenshotAlt: t("labels.screenshotAlt", { name: t(`list.${work.id}.name`) }),
    year: work.year,
    status: work.status,
    tech: work.tech,
    metrics: work.metricIds.map((id) => {
      const metric = metricById(id);
      return {
        id: metric.id,
        value: metric.value,
        label: tMetrics(metric.id),
        estimated: metric.estimated,
      };
    }),
  }));

  return (
    <WorksView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      labels={{
        work: t("labels.lavoro"),
        choice: t("labels.scelta"),
        approach: t("labels.conduzione"),
        visit: t("labels.visit"),
        confidential: t("labels.riservato"),
        open: t("labels.open"),
        close: t("labels.close"),
        putBack: t("labels.riporta"),
        archive: t("labels.archivio"),
        dossier: t("labels.pratica"),
        before: t("labels.comEra"),
        client: t("labels.cliente"),
        year: t("labels.anno"),
        status: t("labels.stato"),
        online: t("labels.online"),
        attachment: t("labels.allegato"),
        measured: t("labels.rilevato"),
        measuredSoFar: t("labels.rilevatoFinora"),
        estimate: t("labels.stima"),
        delivered: t("labels.consegnato"),
        inProgress: t("labels.inCorso"),
        signatureName: t("labels.firmaNome"),
        signatureRole: t("labels.firmaRuolo"),
      }}
      items={items}
    />
  );
}
