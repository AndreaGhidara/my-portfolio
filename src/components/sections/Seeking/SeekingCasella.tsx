import Image from "next/image";
import { Reveal } from "@/animations/components/Reveal";
import { brandAssets } from "@/content/brand-assets";

/** Una delle cinque, vista come la mail che quella richiesta scriverebbe. */
export type SeekingMail = {
  id: string;
  /** Il mittente apparente: il nome che diamo a questa forma di intervento —
   *  «Uno strumento», «Un fulcro». Dare un nome a una cosa che il visitatore ha
   *  in testa senza nome e' gia' consulenza, e succede prima che apra. */
  nome: string;
  oggetto: string;
  /** Le due righe che si leggono senza aprire. Erano la `voice`, la frase
   *  parlata della strada: stessa cosa, detta come si scrive una mail. */
  anteprima: string;
  et: string;
  titolo: string;
  etPrima: string;
  prima: string;
  tipo: string;
  cta: string;
  /** Dove si va a vedere che non e' una promessa. Manca per «non ancora»: a
   *  chi ha appena ammesso di non sapere non si chiede di andare da nessuna
   *  parte. */
  prova: { testo: string; ancora: string } | null;
};

/** La cornice della casella: le stesse parole in tutte e cinque le mail. */
export type SeekingCasellaChrome = {
  etichettaDa: string;
  etichettaA: string;
  /** Il mittente. NON e' un nome di persona: inventarne uno sarebbe una
   *  recensione falsa, lasciare il campo vuoto romperebbe la lettera. */
  da: string;
  a: string;
  /** Cosa c'e' nel riquadro di lettura prima che si apra qualcosa. */
  vuoto: string;
  firma: string;
  ruolo: string;
};

/**
 * La casella di posta: elenco a sinistra, mail aperta a destra.
 *
 * Prima erano cinque riquadri in colonna e la domanda era «da dove parti?».
 * Adesso la domanda non si fa piu': queste sono le cinque mail che arrivano
 * davvero, e queste sono le risposte. Il visitatore non compila niente — legge
 * la posta di qualcun altro e ci si riconosce. La forma paga da sola due cose
 * che prima andavano difese: la stabilita' (una casella non si muove, non e'
 * una correzione, e' quello che una casella e') e soprattutto il fatto che le
 * CINQUE ANTEPRIME SI LEGGONO TUTTE PRIMA DI SCEGLIERE. Chi non apre niente
 * esce comunque avendo letto cinque volte che tipo di problemi tratti: e' la
 * cosa che nessuna delle versioni precedenti sapeva fare.
 *
 * NIENTE JAVASCRIPT, ed e' la decisione che tiene in piedi tutto il resto: la
 * scelta e' un gruppo di radio, la mail si apre con `:has()`. Funziona a
 * JavaScript spento, non ha un livello di movimento da rispettare, non lascia
 * niente da spegnere quando la pagina cambia stato, e la navigazione da
 * tastiera — frecce fra le opzioni, un solo stop nel giro dei Tab — arriva
 * gratis dal browser invece che da una nostra imitazione.
 *
 * Le risposte stanno TUTTE nel DOM e le nasconde il CSS. Senza fogli di stile
 * si leggono tutte e cinque di fila: lunga, ma completa. E' lo stesso patto
 * del tavolo — quello che si vede quando non funziona niente e' il contenuto
 * intero, mai un buco.
 *
 * Il gruppo e' una <fieldset> con la sua <legend>: per uno screen reader le
 * cinque opzioni sono una domanda sola con cinque risposte, non cinque caselle
 * sparse. La legenda ripete il titolo della sezione ed e' nascosta alla vista,
 * perche' scritta due volte si leggerebbe due volte.
 */
export function SeekingCasella({
  mail,
  titolo,
  etichettaTipo,
  casella,
}: {
  mail: SeekingMail[];
  /** Ripetuto come legenda del gruppo, e nascosto alla vista. */
  titolo: string;
  /** L'etichetta dell'ultimo paragrafo di ogni risposta: uguale per tutte,
   *  quindi non e' un campo delle cinque. */
  etichettaTipo: string;
  casella: SeekingCasellaChrome;
}) {
  return (
    <fieldset data-casella>
      <legend className="sr-only">{titolo}</legend>

      <Reveal as="div" data-elenco stagger={0.07}>
        {mail.map((m, indice) => (
          <label key={m.id} data-mail>
            {/* La prima e' gia' aperta. Prima non lo era, e la nota diceva che
                le cinque dovevano restare pari finche' non se ne toccava una:
                il costo era che il riquadro di lettura si apriva su una frase
                di servizio, e chi non tocca niente non vedeva mai una risposta,
                cioe' la cosa che questa sezione esiste per mostrare. Le
                anteprime restano tutte e cinque leggibili accanto, quindi
                quello che la nota difendeva non si perde. */}
            <input type="radio" name="posta" value={m.id} defaultChecked={indice === 0} />
            <span data-mail-testa>
              <span data-mail-da>{m.nome}</span>
            </span>
            <span data-mail-ogg>{m.oggetto}</span>
            <span data-mail-ant>{m.anteprima}</span>
          </label>
        ))}
      </Reveal>

      <div data-lettura>
        {/* Il riquadro non e' mai vuoto: la prima mail e' aperta di suo. Questa
            frase resta per il caso in cui non lo sia — JavaScript spento non
            c'entra (l'attributo `checked` e' nell'HTML servito), ma basta che
            qualcuno tolga la spunta dal gruppo perche' torni a servire. */}
        <p data-vuoto>{casella.vuoto}</p>

        <div data-messaggi>
          {mail.map((m) => (
            <article key={m.id} data-msg>
              <div data-msg-testa>
                <dl>
                  <dt>{casella.etichettaDa}</dt>
                  <dd data-msg-da>{casella.da}</dd>
                  <dt>{casella.etichettaA}</dt>
                  <dd>{casella.a}</dd>
                </dl>
                <h3 data-msg-oggetto>{m.oggetto}</h3>
              </div>

              <div data-msg-corpo>
                <p>
                  <span data-msg-et>{m.et}</span>
                  <b>{m.titolo}</b>
                </p>
                <p>
                  <span data-msg-et>{m.etPrima}</span>
                  {m.prima}
                </p>
                <p>
                  <span data-msg-et>{etichettaTipo}</span>
                  {m.tipo}
                </p>
              </div>

              <div data-firma>
                {/* Decorativo: il nome e' scritto qui di fianco, e un alt
                    ripetuto su cinque ritratti uguali sarebbe la stessa frase
                    letta cinque volte per niente. */}
                <Image
                  src={brandAssets.avatar.src}
                  alt=""
                  width={96}
                  height={96}
                  sizes="48px"
                  data-firma-faccia
                />
                <span data-firma-testo>
                  {casella.firma}
                  <br />
                  {casella.ruolo}
                </span>
              </div>

              <p data-msg-azioni>
                <a href="#contact" data-msg-cta>
                  {m.cta}
                </a>
                {m.prova ? (
                  <a href={m.prova.ancora} data-msg-prova>
                    {m.prova.testo}
                  </a>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
