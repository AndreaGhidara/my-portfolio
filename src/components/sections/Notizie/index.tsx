import { getLocale, getTranslations } from "next-intl/server";
import { NotizieView } from "./NotizieView";
import { testiNotizie } from "./testi";

export async function Notizie() {
  const t = await getTranslations("notizie");
  const locale = await getLocale();

  return (
    <NotizieView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      locale={locale}
      testi={testiNotizie(t)}
    />
  );
}
