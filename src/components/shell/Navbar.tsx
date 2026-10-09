import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { site } from "@/content/site";

// A tutta larghezza e non in un contenitore centrato: il nome e il tema cadono
// sulle verticali della prima e dell'ultima "A" di ANDREA nell'hero.
export async function Navbar() {
  const t = await getTranslations("nav");

  const links = [
    { href: "#services", label: t("services") },
    { href: "#works", label: t("works") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <nav className="relative z-10 flex items-center justify-between px-[var(--gutter)] py-3">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:rounded focus:bg-[var(--fg)] focus:px-3 focus:py-2 focus:text-[var(--bg)]"
      >
        {t("skipToContent")}
      </a>

      {/* py: il nome e' alto 17px, sotto i 24 di WCAG 2.2. La barra non si alza:
          la sua altezza la detta il bottone del tema. */}
      <a href="#top" className="py-2 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[var(--fg)]">
        {site.name}
      </a>

      <div className="flex items-center gap-4">
        <ul className="hidden gap-5 text-xs font-bold uppercase tracking-[0.14em] md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <LanguageSwitcher label={t("languageLabel")} />
        <ThemeToggle label={t("themeToggle")} />
      </div>
    </nav>
  );
}
