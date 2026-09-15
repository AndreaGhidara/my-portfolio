import { getTranslations } from "next-intl/server";
import { site } from "@/content/site";
import { FooterView } from "./FooterView";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <FooterView
      tagline={t("tagline")}
      rispondiA={t("rispondiA")}
      ancheQui={t("ancheQui")}
      citta={t("citta")}
      ufficio={t("ufficio")}
      paese={t("paese")}
      rights={t("rights")}
      name={site.name}
      email={site.email}
      socials={[...site.socials]}
      ariaLabels={{ linkedin: t("linkedinAria"), github: t("githubAria") }}
    />
  );
}
