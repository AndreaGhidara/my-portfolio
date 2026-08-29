export type FooterViewProps = {
  tagline: string;
  emailLabel: string;
  rights: string;
  name: string;
  email: string;
  socials: { id: string; url: string }[];
  ariaLabels: { linkedin: string; github: string };
};

export function FooterView({
  tagline,
  emailLabel,
  rights,
  name,
  email,
  socials,
  ariaLabels,
}: FooterViewProps) {
  const urlFor = (id: string) => socials.find((social) => social.id === id)?.url ?? "#";

  return (
    <footer className="bg-[var(--fg)] px-[var(--gutter)] py-12 text-[var(--bg)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-xs text-lg font-semibold">{tagline}</p>
          {/* Niente opacita' sul testo: l'opacita' comporrebbe il colore
              contro lo sfondo prima che il contrasto venga misurato, e la
              gerarchia con lo sfondo (--fg) e' gia' invertita rispetto al
              resto della pagina. La distinzione arriva da dimensione e
              spaziatura, non da un colore piu' debole. */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em]">{emailLabel}</p>
          <a href={`mailto:${email}`} className="mt-1 block underline underline-offset-4">
            {email}
          </a>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          <ul className="flex gap-4 text-xs font-extrabold uppercase tracking-[0.14em]">
            <li>
              <a
                href={urlFor("linkedin")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabels.linkedin}
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={urlFor("github")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabels.github}
              >
                GitHub
              </a>
            </li>
          </ul>
          <p className="text-xs">
            © {new Date().getFullYear()} {name}. {rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
