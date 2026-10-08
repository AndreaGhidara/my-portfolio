import { getTranslations } from "next-intl/server";

// Le stesse voci della barra in alto, che sotto i 768px non ci stanno: due <nav>
// uguali vanno distinti per chi ascolta la pagina, da qui l'aria-label. Niente
// stato attivo: vorrebbe dire misurare lo scorrimento a ogni fotogramma.
export async function BottomNav() {
  const t = await getTranslations("nav");

  const links = [
    { href: "#services", label: t("services") },
    { href: "#works", label: t("works") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <nav data-nav-bottom aria-label={t("sections")}>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
