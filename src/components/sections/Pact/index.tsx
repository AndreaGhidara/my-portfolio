import { getTranslations } from "next-intl/server";
import { PactView, type PactStep } from "./PactView";

const STEP_IDS = ["reply", "call", "proposal", "decide"] as const;

export async function Pact() {
  const t = await getTranslations("pact");

  const steps: PactStep[] = STEP_IDS.map((id) => ({
    id,
    title: t(`steps.${id}.title`),
    body: t(`steps.${id}.body`),
  }));

  return (
    <PactView eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} steps={steps} />
  );
}
