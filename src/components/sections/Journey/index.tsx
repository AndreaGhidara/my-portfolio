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
    // Solo la prima porta «a oggi», e si sa dalla posizione: il dato e'
    // ordinato dal piu' recente, e una prova del contenuto lo garantisce. Per
    // questo si calcola PRIMA di girare la lista.
    present: index === 0,
    role: t(`list.${entry.id}.role`),
    body: t(`list.${entry.id}.body`),
    lezione: t(`list.${entry.id}.lezione`),
  }));
  // Il percorso si racconta dal 2023 a oggi: si inverte la presentazione, non
  // il dato, che resta dal piu' recente con il suo contratto e il suo test.
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
      senzaTesserino={t("senzaTesserino")}
      etichettaLezione={t("etichettaLezione")}
      nota={t("nota")}
      suggerimento={t("suggerimento")}
      entries={entries}
      stats={stats}
    />
  );
}
