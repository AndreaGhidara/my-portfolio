import { getTranslations } from "next-intl/server";

/**
 * Le tre voci, sul telefono.
 *
 * Sopra i 768px non esiste: li' stanno nella barra in alto, che e' dove uno le
 * cerca. Sotto, la barra in alto le perde (non ci stanno accanto al nome, alla
 * lingua e al tema) e per un po' non c'era niente al loro posto: la pagina e'
 * alta una ventina di schermate, e da meta' sito l'unico modo di tornare ai
 * Contatti era scorrere a mano fino in fondo. Meta' di chi apre il sito lo
 * apre da telefono.
 *
 * Sono ancore verso le stesse tre sezioni della barra in alto, non una
 * navigazione diversa: due <nav> con le stesse voci vanno distinti per chi
 * ascolta la pagina, ed e' il motivo dell'aria-label.
 *
 * Niente stato attivo: dirlo vorrebbe dire misurare lo scorrimento e
 * riscriverlo a ogni fotogramma, e una voce che si accende e si spegne mentre
 * scorri e' rumore, non informazione. Qui serve un modo per andare, non una
 * mappa di dove sei.
 */
export async function BottomNav() {
  const t = await getTranslations("nav");

  const links = [
    { href: "#services", label: t("services") },
    { href: "#works", label: t("works") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <nav data-nav-basso aria-label={t("sections")}>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
