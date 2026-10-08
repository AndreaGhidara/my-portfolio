import { Reveal } from "@/animations/components/Reveal";
import { Today } from "./Today";
export type FooterViewProps = {
  tagline: string;
  /** L'etichetta sopra l'indirizzo: «Rispondi a». */
  replyTo: string;
  /** L'etichetta sopra i profili. NON e' «Mittente»: vedi sotto. */
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

/**
 * Il piede e' la busta per rispondere.
 *
 * La seconda sezione della pagina e' una casella di posta: cinque email in
 * arrivo e le loro risposte. Questa e' l'altro capo, ed e' l'unico cerchio che
 * questa pagina puo' chiudere: si apre ricevendo posta e finisce dando di che
 * rispondere. La mail smette di essere un link in fondo e diventa la riga di un
 * indirizzo, che e' l'unico posto in cui un indirizzo ha senso.
 *
 * La busta occupa tutto il piede: non e' un foglio appoggiato su un blocco
 * scuro, e' il piede stesso. Da qui discendono due cose che non sono scelte di
 * gusto ma conseguenze:
 *
 * - Il copyright non ha piu' un fuori in cui stare, e va DENTRO la busta.
 * - La pagina perde la fine che le dava il blocco d'inchiostro. Il taglio in
 *   fondo ([data-busta]::after) la restituisce: e' lo stesso rimedio scritto
 *   per la proposta A nel prototipo del 14 settembre, dove il problema era
 *   identico e per lo stesso motivo.
 *
 * Due cose che il prototipo sbagliava, e che si sono viste solo scrivendole:
 *
 * 1. Il blocco dei profili era etichettato «Mittente». Su una busta indirizzata
 *    ad Andrea il mittente e' chi scrive, cioe' il visitatore: mettere li' i
 *    profili di Andrea e' una didascalia falsa su un oggetto che vive di
 *    verosimiglianza. L'etichetta dice quello che quel blocco e' davvero.
 * 2. La busta perdeva la tagline, che e' la sola frase del sito che dice cosa
 *    fa e da dove, e non esiste in nessun'altra sezione. Adesso sta in basso a
 *    sinistra, piccola: e' esattamente dove le buste commerciali stampano la
 *    loro riga, quindi non e' un ripiego ma il posto giusto.
 */
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

  /**
   * Le barre di smistamento in fondo alla busta.
   *
   * NON e' un codice a barre e nessuno scanner lo legge: e' la stringa
   * dell'indirizzo resa come ritmo, una barra per carattere, alta o bassa
   * secondo il codice del carattere. Deterministico apposta, cosi' non cambia a
   * ogni render e non ha bisogno di un valore casuale che il server e il
   * browser calcolerebbero diverso. Se un giorno deve essere scansionabile va
   * generato da una libreria, non da questa riga.
   */
  const bars = Array.from(email, (char) => char.charCodeAt(0) % 2 === 0);

  return (
    <footer data-footer>
      {/* I tre blocchi della busta entrano uno dopo l'altro. L'attributo resta
          qui: [data-busta] porta il fondo, la patta e il taglio in fondo alla
          pagina, e un involucro in mezzo li staccherebbe dal contenuto. */}
      <Reveal data-envelope data-testid="envelope" motion="dietro" stagger={0.12}>
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

          {/* Francobollo e annullo non aggiungono niente a chi ascolta la
              pagina: la citta' sta gia' nella riga dell'indirizzo, e il resto
              e' disegno. Un nome accessibile qui sarebbe la stessa cosa letta
              due volte. */}
          {/* Il francobollo e l'annullo cadono sulla busta dopo che la busta
              c'e': e' il gesto di affrancare, e succede per ultimo anche nella
              vita. `as="span"` perche' qui dentro sta in una riga di testo. */}
          <Reveal
            as="span"
            motion="alto"
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
            {/* Niente opacita' sul testo: l'opacita' comporrebbe il colore
                contro lo sfondo prima che il contrasto venga misurato. La
                distinzione arriva da dimensione e posizione, non da un colore
                piu' debole. */}
            <p data-footer-rights>
              © <Today format="year" /> {name}. {rights}
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
