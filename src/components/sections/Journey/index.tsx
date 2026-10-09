import { getTranslations } from "next-intl/server";
import { journey } from "@/content/journey";
import { metricById } from "@/content/metrics";
import { JourneyView, type JourneyEntryView, type JourneyStat } from "./JourneyView";

const STAT_IDS = ["years", "responseTime"] as const;

export async function Journey() {
  const t = await getTranslations("journey");
  const tMetrics = await getTranslations("metrics");

  const entries: JourneyEntryView[] = journey.map((entry, index) => ({
    id: entry.id,
    company: entry.company,
    year: entry.year,
    badge: entry.badge,
    // «a oggi» si calcola PRIMA di girare la lista: il dato e' dal piu' recente,
    // e una prova del contenuto lo garantisce.
    present: index === 0,
    role: t(`list.${entry.id}.role`),
    body: t(`list.${entry.id}.body`),
    lesson: t(`list.${entry.id}.lezione`),
  }));
  // Si inverte la presentazione, non il dato, che resta dal piu' recente.
  entries.reverse();

  const stats: JourneyStat[] = STAT_IDS.map((id) => {
    const metric = metricById(id);
    return { id: metric.id, value: metric.value, label: tMetrics(metric.id) };
  });

  return (
    <JourneyView
      eyebrow={t("eyebrow")}
      title={t("title")}
      present={t("present")}
      noBadge={t("senzaTesserino")}
      lessonLabel={t("etichettaLezione")}
      note={t("nota")}
      hint={t("suggerimento")}
      entries={entries}
      stats={stats}
    />
  );
}
