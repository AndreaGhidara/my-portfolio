import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Code2, Zap, Wrench } from "lucide-react";

const icons = [Code2, Zap, Wrench];
const serviceKeys = ["webdev", "uiux", "consulting"] as const;

const chipStyles: Record<string, string> = {
  webdev:     "bg-blue-500/10 text-blue-600 border border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/25",
  uiux:       "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25",
  consulting: "bg-purple-500/10 text-purple-600 border border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30 hover:bg-purple-500/20 dark:hover:bg-purple-500/25",
};

const iconHoverStyles: Record<string, string> = {
  webdev:     "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  uiux:       "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  consulting: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
};

export default async function Services() {
  const t = await getTranslations("services");

  const services = serviceKeys.map((key, i) => ({
    key,
    Icon: icons[i],
    title: t(`list.${key}.title`),
    description: t(`list.${key}.description`),
  }));

  return (
    <section id="services" className="bg-slate-50 dark:bg-zinc-900">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900 dark:text-white mb-4">
            {t("heading")}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(({ key, Icon, title, description }) => (
            <div
              key={key}
              className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1d20] p-8 overflow-hidden transition-transform duration-300 hover:scale-[1.03]"
            >
              <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  color: "currentColor",
                }}
                aria-hidden="true"
              />

              <div className="relative z-10 flex flex-col gap-4 flex-1">
                <Icon
                  size={26}
                  className={`text-slate-400 dark:text-slate-500 transition-colors duration-300 ${iconHoverStyles[key]}`}
                />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">
                  {description}
                </p>
                <div className="mt-2">
                  <Link
                    href="#contact"
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors duration-200 ${chipStyles[key]}`}
                  >
                    {t("cta")} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
