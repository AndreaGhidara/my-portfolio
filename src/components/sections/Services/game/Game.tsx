"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useTranslations } from "next-intl";
import { palette } from "@/styles/palette";
import { useVisibile } from "./useVisible";
import { LIVELLI, numeroLivello, type IdLivello, type LivelloProps } from "./levels";
import { Schermo } from "./Screen";
import { Logiche } from "./Logic";
import { Pannello } from "./Panel";
import { Notte } from "./Night";
import { Finale } from "./Ending";

export { LIVELLI, type IdLivello, type LivelloProps };

/**
 * Il gioco del metodo: sotto i 1024px prende il posto del tavolo. Quattro
 * livelli in fila e un finale, in un banco alto uguale per tutti.
 *
 * Il guscio tiene solo il giro: dove sei, fin dove sei arrivato, le quattro
 * barrette e la riga che dice cosa si fa nel livello. Il resto e' dei livelli.
 *
 * IL CONTRATTO DEI LIVELLI (Schermo, Logiche, Pannello, Notte, Finale):
 *
 * - Props: `LivelloProps = { onAvanti: () => void; visibile: boolean }`, e
 *   nient'altro. onAvanti porta al livello dopo (nel finale ricomincia dal
 *   primo); visibile e' false quando il gioco e' uscito dallo schermo, e li'
 *   i timer del livello si fermano.
 * - Radice: un solo elemento `.banco` con `data-gioco-livello="<id>"`
 *   (schermo, logiche, pannello, notte, finale). Ogni regola del suo CSS
 *   (src/styles/gioco/<id>.css) sta sotto quell'attributo; i pezzi comuni
 *   sono in base.css, sotto [data-gioco].
 * - Testi: ognuno se li legge da se' con
 *   `useTranslations("services.gioco.<id>")`, e `t.raw` per le strutture.
 *   Il provider di layout.tsx passa gia' tutti i messaggi al client.
 * - Stato: cambiando livello il componente si rimonta (la key e' l'id), quindi
 *   riparte pulito ogni volta. Niente stato da tenere fra un'apertura e
 *   l'altra.
 * - Prove: `renderConTesti` (src/test/renderConTesti.tsx) per i testi veri,
 *   `installaIntersectionObserver` (src/test/intersectionObserver.ts) per
 *   pilotare `visibile` passando dal guscio.
 */

/** I quattro livelli e il finale, nell'ordine. Il finale e' il quinto passo. */
type Passo = IdLivello | "finale";
const PASSI: readonly Passo[] = [...LIVELLI, "finale"];
const FINALE = LIVELLI.length;

const COMPONENTI: Record<Passo, ComponentType<LivelloProps>> = {
  schermo: Schermo,
  logiche: Logiche,
  pannello: Pannello,
  notte: Notte,
  finale: Finale,
};

/**
 * I tre token fissi che fra le variabili globali non ci sono: tokens.css ha
 * --verde, che col tema cambia, e il grigio chiaro solo dentro --fg-muted del
 * tema scuro. Il banco non segue il tema, quindi li prende da palette.ts e li
 * scrive sulla sua radice, dove base.css e i livelli li trovano.
 */
const TOKEN_FISSI = {
  "--mutedDark": palette.mutedDark,
  "--green": palette.green,
  "--greenDark": palette.greenDark,
} as CSSProperties;

/**
 * Quanto dura la guardia sul doppio tocco. Il banco e' alto uguale per tutti e
 * i pulsanti dello stato dopo compaiono nello stesso punto di quelli di prima:
 * il secondo tocco di un doppio tocco premerebbe quello appena comparso
 * («avanti» e poi «fai» del nodo dopo, «livello 4» e poi «vai a dormire»).
 */
const DOPPIO_TOCCO = 350;

export function Gioco() {
  const t = useTranslations("services.gioco.comune");
  const radice = useRef<HTMLDivElement | null>(null);
  const visibile = useVisibile(radice);

  // `qui` e' il passo aperto (0..3 i livelli, 4 il finale); `raggiunto` il
  // piu' lontano a cui si e' arrivati, ed e' quello che decide cosa si riapre.
  const [qui, setQui] = useState(0);
  const [raggiunto, setRaggiunto] = useState(0);

  const passo = PASSI[qui];
  const Livello = COMPONENTI[passo];

  // Il timeStamp dell'ultimo tocco accettato su un pulsante delle azioni, e se
  // da allora il livello e' cambiato.
  const ultimoTocco = useRef<number | null>(null);
  const appenaCambiato = useRef(false);

  /*
   * In cattura sulla radice, prima che il pulsante lo senta. La guardia vale
   * solo dove il doppio tocco fa danni: un pulsante delle azioni, oppure il
   * primo tocco nel banco dopo un cambio di livello. Le scelte multiple (gli
   * interruttori della notte, gli attrezzi del livello 1) restano libere, e
   * cosi' le barrette, che non stanno nel banco. timeStamp e non Date: e'
   * l'ora dell'evento, non quella in cui lo si guarda.
   */
  const guardia = (e: MouseEvent<HTMLDivElement>) => {
    const premuto = (e.target as Element).closest("button, a");
    if (!premuto || !premuto.closest("[data-gioco-livello]")) return;
    const azione = premuto.closest(".azioni") !== null;
    const dentro = ultimoTocco.current !== null && e.timeStamp - ultimoTocco.current < DOPPIO_TOCCO;
    if (dentro && (azione || appenaCambiato.current)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    appenaCambiato.current = false;
    if (azione) ultimoTocco.current = e.timeStamp;
  };

  /*
   * Al cambio di livello (non al primo montaggio: li' nessuno ha chiesto
   * niente) il fuoco va sul banco nuovo. Il pulsante premuto non c'e' piu', e
   * il fuoco finirebbe sul body: chi naviga da tastiera ripartirebbe dalla
   * cima della pagina. preventScroll perche' il banco e' gia' dove si guarda.
   */
  const primo = useRef(true);
  useEffect(() => {
    appenaCambiato.current = true;
    if (primo.current) {
      primo.current = false;
      return;
    }
    const nuovo = radice.current?.querySelector<HTMLElement>("[data-gioco-livello]");
    if (!nuovo) return;
    nuovo.tabIndex = -1;
    nuovo.focus({ preventScroll: true });
  }, [passo]);

  const vai = (i: number) => {
    setQui(i);
    setRaggiunto((r) => Math.max(r, i));
  };

  // «Torna al sito»: il giro da capo, e i livelli dopo il primo si richiudono.
  const ricomincia = () => {
    setQui(0);
    setRaggiunto(0);
  };

  return (
    <div ref={radice} data-gioco style={TOKEN_FISSI} onClickCapture={guardia}>
      <div data-gioco-barrette role="group" aria-label={t("barrette")}>
        {LIVELLI.map((id, i) => {
          // Nel finale nessuna barretta e' «qui»: sono tutte fatte.
          const stato = i === qui ? "qui" : i <= raggiunto ? "fatto" : "dopo";
          return (
            <button
              key={id}
              type="button"
              data-stato={stato}
              aria-current={stato === "qui" ? "step" : undefined}
              // Il livello aperto non si disabilita: chi ci e' arrivato da
              // tastiera perderebbe il fuoco nel momento in cui lo apre.
              aria-disabled={stato === "qui" || undefined}
              disabled={stato === "dopo"}
              onClick={() => {
                if (stato === "fatto") vai(i);
              }}
            >
              <i aria-hidden="true" />
              {t("etichetta", { numero: numeroLivello(id), nome: t(`livelli.${id}`) })}
            </button>
          );
        })}
      </div>

      {/* La regione resta la stessa e cambia il testo dentro: una regione
          appena nata non la annuncia nessuno. Il testo ha la sua key per
          rientrare in dissolvenza. */}
      <div data-gioco-riga aria-live="polite">
        <p key={`riga-${passo}`}>{t(`righe.${passo}`)}</p>
      </div>

      <Livello
        key={`banco-${passo}`}
        visibile={visibile}
        onAvanti={qui === FINALE ? ricomincia : () => vai(qui + 1)}
      />
    </div>
  );
}
