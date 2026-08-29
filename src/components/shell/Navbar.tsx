import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { site } from "@/content/site";

/**
 * A tutta larghezza, non incolonnata in un contenitore centrato: cosi' il
 * nome in alto a sinistra cade sulla stessa verticale della "A" di ANDREA
 * nell'hero, e il tema in alto a destra sull'ultima "A". Il portfolio non
 * ha una colonna di testo da rispettare: ha due bordi.
 *
 * Sobria per scelta: il nome grande sta nell'hero, qui basta l'ancora.
 * Il link "salta al contenuto" è il primo elemento focalizzabile della
 * pagina: senza, chi naviga da tastiera deve attraversare la navbar a
 * ogni visita.
 */
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

      <a href="#top" className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[var(--fg)]">
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
