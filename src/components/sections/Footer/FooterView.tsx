import { Reveal } from "@/animations/components/Reveal";
export type FooterViewProps = {
  tagline: string;
  /** L'etichetta sopra l'indirizzo: «Rispondi a». */
  rispondiA: string;
  /** L'etichetta sopra i profili. NON e' «Mittente»: vedi sotto. */
  ancheQui: string;
  citta: string;
  /** L'ufficio sull'annullo postale. */
  ufficio: string;
  /** Il paese sul francobollo. */
  paese: string;
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
  rispondiA,
  ancheQui,
  citta,
  ufficio,
  paese,
  rights,
  name,
  email,
  socials,
  ariaLabels,
}: FooterViewProps) {
  const urlFor = (id: string) =>
    socials.find((social) => social.id === id)?.url ?? "#";

  const oggi = new Date();
  const gg = String(oggi.getDate()).padStart(2, "0");
  const mm = String(oggi.getMonth() + 1).padStart(2, "0");
  const data = `${gg}.${mm}.${String(oggi.getFullYear()).slice(-2)}`;

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
  const barre = Array.from(email, (char) => char.charCodeAt(0) % 2 === 0);

  return (
    <footer data-footer>
      {/* I tre blocchi della busta entrano uno dopo l'altro. L'attributo resta
          qui: [data-busta] porta il fondo, la patta e il taglio in fondo alla
          pagina, e un involucro in mezzo li staccherebbe dal contenuto. */}
      <Reveal data-busta data-testid="busta" moto="dietro" stagger={0.12}>
        <div data-busta-alto>
          <p data-busta-profili data-testid="busta-profili">
            <span data-busta-et>{ancheQui}</span>
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
            moto="alto"
            delay={0.25}
            data-busta-affrancatura
            data-testid="busta-affrancatura"
            aria-hidden="true"
          >
            <span data-francobollo>
              {/* Il monogramma e' testo grande, quindi carta su arancio (3,27:1)
                  e' ammessa. «ITALIA» e' a mezzo rem e sotto AA: sta in
                  --on-accent, che fa 5,08:1. Vedi contrast.test.ts. */}
              <b data-francobollo-sigla>AG</b>
              <span data-francobollo-paese data-testid="francobollo-paese">
                {paese}
              </span>
            </span>
            <svg data-busta-annullo viewBox="0 0 100 100">
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
                {ufficio}
              </text>
              <text
                x="50"
                y="60"
                textAnchor="middle"
                fontSize="9.5"
                letterSpacing=".3"
                data-testid="busta-annullo-data"
              >
                {data}
              </text>
            </svg>
          </Reveal>
        </div>

        <div data-busta-indirizzo data-testid="busta-indirizzo">
          <p data-busta-et>{rispondiA}</p>
          <p data-busta-nome>{name}</p>
          <a data-busta-mail href={`mailto:${email}`}>
            {email}
          </a>
          <p data-busta-citta>{citta}</p>
        </div>

        <div data-busta-basso>
          <p data-busta-tagline>{tagline}</p>
          <div data-busta-basso-dx>
            <span data-busta-codice aria-hidden="true">
              {barre.map((alta, i) => (
                <i key={i} data-alta={alta ? "" : undefined} />
              ))}
            </span>
            {/* Niente opacita' sul testo: l'opacita' comporrebbe il colore
                contro lo sfondo prima che il contrasto venga misurato. La
                distinzione arriva da dimensione e posizione, non da un colore
                piu' debole. */}
            <p data-footer-diritti>
              © {oggi.getFullYear()} {name}. {rights}
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
