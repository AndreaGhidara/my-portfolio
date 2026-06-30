import { getTranslations } from "next-intl/server";
import ContactAnimator from "@/components/organisms/ContactMe/ContactAnimator";
import ContactForm from "@/components/organisms/ContactMe/ContactForm";

export default async function ContactMe() {
  const t = await getTranslations("contact");

  const contactFormTranslations = {
    labels: { name: t("labels.name"), email: t("labels.email"), message: t("labels.message") },
    placeholders: { email: t("placeholders.email"), message: t("placeholders.message") },
    button: { sending: t("button.sending"), default: t("button.default") },
    status: { success: t("status.success"), error: t("status.error") },
    errors: {
      nameRequired: t("errors.nameRequired"), nameMin: t("errors.nameMin"),
      emailRequired: t("errors.emailRequired"), emailInvalid: t("errors.emailInvalid"),
      messageRequired: t("errors.messageRequired"), messageMin: t("errors.messageMin"),
    },
  };

  const staticContent = (
    <>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
        {t("subtitle")}
      </p>
    </>
  );

  return (
    <section id="contact" className="flex min-h-screen w-full items-center justify-center px-6 py-16 lg:py-24 bg-slate-50 dark:bg-[#1a1d20]">
      <ContactAnimator
        staticContent={staticContent}
        formComponent={<ContactForm translations={contactFormTranslations} />}
      />
    </section>
  );
}