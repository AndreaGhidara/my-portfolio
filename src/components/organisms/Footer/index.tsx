
import { getTranslations } from "next-intl/server";
import FooterClient from "./FooterClient";

const contactData = {
  email: "andrea.ghidara.99@gmail.com",
  phone: "351 335 0725",
  address: "Torino",
  linkedin: "https://it.linkedin.com/in/andrea-ghidara",
  github: "https://github.com/AndreaGhidara",
} as const;

export default async function Footer() {
  const t = await getTranslations("footer");

  const translations = {
    brandAria: t("brandAria"),
    brandName: t("brandName"),
    ctaTitle: t("ctaTitle"),
    ctaSubtitle: t("ctaSubtitle"),
    emailTitle: t("emailTitle"),
    phoneTitle: t("phoneTitle"),
    addressTitle: t("addressTitle"),
    copyright: t("copyright"),
    socials: {
      linkedinAria: t("socials.linkedinAria"),
      githubAria: t("socials.githubAria"),
    },
  };

  const currentYear = new Date().getFullYear();

  return (
    <FooterClient
      translations={translations}
      contactData={contactData}
      currentYear={currentYear}
    />
  );
}