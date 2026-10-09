import { getLocale, getTranslations } from "next-intl/server";
import { NewsView } from "./NewsView";
import { newsCopy } from "./copy";

export async function News() {
  const t = await getTranslations("notizie");
  const locale = await getLocale();

  return (
    <NewsView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      locale={locale}
      copy={newsCopy(t)}
    />
  );
}
