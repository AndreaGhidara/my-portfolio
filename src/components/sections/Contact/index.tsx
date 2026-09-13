import { getTranslations } from "next-intl/server";
import { site } from "@/content/site";
import { ContactView } from "./ContactView";

/** I tre momenti di «cosa succede dopo», nell'ordine in cui succedono. Sono
 *  una lista di chiavi e nient'altro, quindi stanno qui e non in un file di
 *  contenuto: non c'e' nessun altro dato da tenere insieme a loro. */
const DOPO_IDS = ["risposta", "chiamata", "preventivo"] as const;

export async function Contact() {
  const t = await getTranslations("contact");

  return (
    <ContactView
      eyebrow={t("eyebrow")}
      title={t("title")}
      client={{
        eyebrow: t("client.eyebrow"),
        title: t("client.title"),
        body: t("client.body"),
      }}
      dopo={{
        etichetta: t("dopo.etichetta"),
        momenti: DOPO_IDS.map((id) => ({
          id,
          quando: t(`dopo.momenti.${id}.quando`),
          titolo: t(`dopo.momenti.${id}.titolo`),
          testo: t(`dopo.momenti.${id}.testo`),
        })),
      }}
      recruiter={{
        eyebrow: t("recruiter.eyebrow"),
        title: t("recruiter.title"),
        body: t("recruiter.body"),
        cv: t("recruiter.cv"),
        linkedin: t("recruiter.linkedin"),
        github: t("recruiter.github"),
      }}
      cvPath={site.cvPath}
      socials={[...site.socials]}
      form={{
        labels: { name: t("labels.name"), email: t("labels.email"), message: t("labels.message") },
        placeholders: {
          name: t("placeholders.name"),
          email: t("placeholders.email"),
          message: t("placeholders.message"),
        },
        button: { default: t("button.default"), sending: t("button.sending") },
        status: { success: t("status.success"), error: t("status.error") },
        errors: {
          nameRequired: t("errors.nameRequired"),
          nameMin: t("errors.nameMin"),
          emailRequired: t("errors.emailRequired"),
          emailInvalid: t("errors.emailInvalid"),
          messageRequired: t("errors.messageRequired"),
          messageMin: t("errors.messageMin"),
        },
      }}
    />
  );
}
