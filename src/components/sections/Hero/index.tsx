import { getTranslations } from "next-intl/server";
import { HeroView } from "./HeroView";

export async function Hero() {
  const t = await getTranslations("hero");

  return (
    <HeroView
      eyebrow={t("eyebrow")}
      wordmarkAlt={t("wordmarkAlt")}
      heading={t("heading")}
      claim={t("claim")}
      subclaim={t("subclaim")}
      ctaPrimary={t("ctaPrimary")}
      ctaSecondary={t("ctaSecondary")}
      scrollHint={t("scrollHint")}
    />
  );
}
