import { Reveal } from "@/animations/components/Reveal";
import { Today } from "./Today";
export type FooterViewProps = {
  tagline: string;
  /** L'etichetta sopra l'indirizzo: «Rispondi a». */
  replyTo: string;
  /** Non «Mittente»: su una busta indirizzata ad Andrea il mittente e' il visitatore. */
  alsoHere: string;
  city: string;
  /** L'ufficio sull'annullo postale. */
  office: string;
  /** Il paese sul francobollo. */
  country: string;
  rights: string;
  name: string;
  email: string;
  socials: { id: string; url: string }[];
  ariaLabels: { linkedin: string; github: string };
};

// La busta occupa tutto il piede: il copyright va dentro, e il taglio in fondo
// ([data-envelope]::after) restituisce alla pagina la fine che le dava il blocco
// d'inchiostro.
export function FooterView({
  tagline,
  replyTo,
  alsoHere,
  city,
  office,
  country,
  rights,
  name,
  email,
  socials,
  ariaLabels,
}: FooterViewProps) {
  const urlFor = (id: string) =>
    socials.find((social) => social.id === id)?.url ?? "#";

  // Non e' un codice a barre: l'indirizzo reso come ritmo, una barra per carattere.
  // Deterministico, perche' server e browser lo calcolino uguale.
  const bars = Array.from(email, (char) => char.charCodeAt(0) % 2 === 0);

  return (
    <footer data-footer>
      {/* L'attributo resta qui: [data-envelope] porta il fondo, la patta e il
          taglio, e un involucro in mezzo li staccherebbe dal contenuto. */}
      <Reveal data-envelope data-testid="envelope" motion="behind" stagger={0.12}>
        <div data-envelope-top>
          <p data-envelope-profiles data-testid="envelope-profiles">
            <span data-envelope-label>{alsoHere}</span>
            <a
              href={urlFor("linkedin")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ariaLabels.linkedin}
            >
              LinkedIn
            </a>
            <a
              href={urlFor("github")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ariaLabels.github}
            >
              GitHub
            </a>
          </p>

          {/* Decorativi: la citta' sta gia' nell'indirizzo. Cadono per ultimi, come
              quando si affranca. `as="span"` perche' sta in una riga di testo. */}
          <Reveal
            as="span"
            motion="above"
            delay={0.25}
            data-envelope-postage
            data-testid="envelope-postage"
            aria-hidden="true"
          >
            <span data-stamp>
              {/* Il monogramma e' testo grande, quindi carta su arancio (3,27:1)
                  e' ammessa. «ITALIA» e' a mezzo rem e sotto AA: sta in
                  --on-accent, che fa 5,08:1. Vedi contrast.test.ts. */}
              <b data-stamp-code>AG</b>
              <span data-stamp-country data-testid="stamp-country">
                {country}
              </span>
            </span>
            <svg data-envelope-postmark viewBox="0 0 100 100">
              <g fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="50" cy="50" r="36" />
                <circle cx="50" cy="50" r="29" strokeWidth="1.2" />
                {/* Le onde di annullo stanno di FIANCO al tondo: servono ad
                    annullare il francobollo, non a coprire la dicitura
                    dell'ufficio. Attraversandolo tagliavano la data. */}
                <path
                  d="M0 36h10M0 50h10M0 64h10"
                  strokeWidth="1.6"
                  strokeDasharray="3 4"
                />
                <path
                  d="M90 36h10M90 50h10M90 64h10"
                  strokeWidth="1.6"
                  strokeDasharray="3 4"
                />
              </g>
              <text
                x="50"
                y="45"
                textAnchor="middle"
                fontSize="11"
                letterSpacing=".5"
              >
                {office}
              </text>
              <text
                x="50"
                y="60"
                textAnchor="middle"
                fontSize="9.5"
                letterSpacing=".3"
                data-testid="envelope-postmark-date"
              >
                <Today format="postmark" />
              </text>
            </svg>
          </Reveal>
        </div>

        <div data-envelope-address data-testid="envelope-address">
          <p data-envelope-label>{replyTo}</p>
          <p data-envelope-name>{name}</p>
          <a data-envelope-mail href={`mailto:${email}`}>
            {email}
          </a>
          <p data-envelope-city>{city}</p>
        </div>

        <div data-envelope-bottom>
          <p data-envelope-tagline>{tagline}</p>
          <div data-envelope-bottom-right>
            <span data-envelope-code aria-hidden="true">
              {bars.map((high, i) => (
                <i key={i} data-high={high ? "" : undefined} />
              ))}
            </span>
            {/* Niente opacita': comporrebbe il colore prima che il contrasto si misuri. */}
            <p data-footer-rights>
              © <Today format="year" /> {name}. {rights}
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
