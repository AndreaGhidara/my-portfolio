import { Reveal } from "@/animations/components/Reveal";

export type SeekingStrada = {
  id: string;
  /** Il nome che diamo a questa forma di intervento: «Uno strumento», «Un
   *  fulcro». Dare un nome a una cosa che il visitatore ha in testa senza nome
   *  e' gia' consulenza, e succede prima che abbia scelto. */
  nome: string;
  voice: string;
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

/**
 * Le cinque strade, e la risposta di quella scelta.
 *
 * NIENTE JAVASCRIPT, ed e' la decisione che tiene in piedi tutto il resto: la
 * scelta e' un gruppo di radio, la risposta si scopre con `:has()`. Funziona a
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
 * cinque opzioni sono una domanda sola con cinque risposte, non cinque
 * caselle sparse. La legenda ripete il titolo della sezione ed e' nascosta
 * alla vista, perche' scritta due volte si leggerebbe due volte.
 */
export function SeekingStrade({
  strade,
  titolo,
  etichettaTipo,
}: {
  strade: SeekingStrada[];
  /** Ripetuto come legenda del gruppo, e nascosto alla vista. */
  titolo: string;
  /** L'etichetta della seconda riga di ogni risposta: uguale per tutte, quindi
   *  non e' un campo delle cinque. */
  etichettaTipo: string;
}) {
  return (
    <div data-strade>
      <fieldset data-scelte>
        <legend className="sr-only">{titolo}</legend>
        <Reveal as="div" data-scelte-lista stagger={0.07}>
          {strade.map((s) => (
            <label key={s.id} data-strada>
              <input type="radio" name="strada" value={s.id} />
              <span data-strada-nome>{s.nome}</span>
              <span data-strada-voce>{s.voice}</span>
            </label>
          ))}
        </Reveal>
      </fieldset>

      <div data-risposte>
        {strade.map((s) => (
          <div key={s.id} data-risposta>
            <p data-risposta-et>{s.et}</p>
            <h3>{s.titolo}</h3>
            <div data-risposta-riga>
              <p data-risposta-et>{s.etPrima}</p>
              <p>{s.prima}</p>
            </div>
            <div data-risposta-riga>
              <p data-risposta-et>{etichettaTipo}</p>
              <p>{s.tipo}</p>
            </div>
            <p data-risposta-azioni>
              <a href="#contact" data-risposta-cta>
                {s.cta}
              </a>
              {s.prova ? (
                <a href={s.prova.ancora} data-risposta-prova>
                  {s.prova.testo}
                </a>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
