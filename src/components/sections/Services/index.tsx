import { getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { ServicesView, type ServiceItem } from "./ServicesView";

export async function Services() {
  const t = await getTranslations("services");

  const items: ServiceItem[] = services.map((service) => ({
    id: service.id,
    title: t(`list.${service.id}.title`),
    description: t(`list.${service.id}.description`),
  }));

  return (
    <ServicesView eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} items={items} />
  );
}
