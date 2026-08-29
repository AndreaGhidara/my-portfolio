import { getTranslations } from "next-intl/server";
import { ProcessView, type ProcessStep } from "./ProcessView";

const STEP_IDS = ["understand", "design", "build", "stay"] as const;

export async function Process() {
  const t = await getTranslations("process");

  const steps: ProcessStep[] = STEP_IDS.map((id) => ({
    id,
    title: t(`steps.${id}.title`),
    body: t(`steps.${id}.body`),
  }));

  return <ProcessView eyebrow={t("eyebrow")} title={t("title")} steps={steps} />;
}
