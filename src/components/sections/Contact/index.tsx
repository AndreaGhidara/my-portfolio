import { getTranslations } from "next-intl/server";
import { site } from "@/content/site";
import { ContactView } from "./ContactView";

export async function Contact() {
  const t = await getTranslations("contact");

  return (
    <ContactView
      eyebrow={t("eyebrow")}
      title={t("title")}
      client={{ title: t("client.title"), body: t("client.body") }}
      recruiter={{
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
