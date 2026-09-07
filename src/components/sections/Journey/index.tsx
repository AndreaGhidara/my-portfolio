import { getTranslations } from "next-intl/server";
import { journey } from "@/content/journey";
import { metricById } from "@/content/metrics";
import { JourneyView, type JourneyEntryView, type JourneyStat } from "./JourneyView";

/** I numeri personali, non quelli legati a un singolo progetto. */
const STAT_IDS = ["years", "responseTime"] as const;

export async function Journey() {
  const t = await getTranslations("journey");
  const tMetrics = await getTranslations("metrics");

  const entries: JourneyEntryView[] = journey.map((entry, index) => ({
    id: entry.id,
    company: entry.company,
    year: entry.year,
    tesserino: entry.tesserino,
    // Solo la prima porta «a oggi», e si sa dalla posizione: la lista e'
    // ordinata dal piu' recente, e una prova del contenuto lo garantisce.
    present: index === 0,
    role: t(`list.${entry.id}.role`),
    body: t(`list.${entry.id}.body`),
    lezione: t(`list.${entry.id}.lezione`),
  }));

  const stats: JourneyStat[] = STAT_IDS.map((id) => {
    const metric = metricById(id);
    return { id: metric.id, value: metric.value, label: tMetrics(metric.id) };
  });

  return (
    <JourneyView
      eyebrow={t("eyebrow")}
      title={t("title")}
      present={t("present")}
      senzaTesserino={t("senzaTesserino")}
      etichettaLezione={t("etichettaLezione")}
      nota={t("nota")}
      entries={entries}
      stats={stats}
    />
  );
}
