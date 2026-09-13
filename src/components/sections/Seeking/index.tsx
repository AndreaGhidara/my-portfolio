import { getTranslations } from "next-intl/server";
import { seekingRoutes } from "@/content/seeking";
import { SeekingView } from "./SeekingView";
import type { SeekingMail } from "./SeekingCasella";

/**
 * Le cinque strade non ricalcano piu' gli id dei servizi, e il legame con la
 * prova non passa piu' dalla posizione: passa da `prova`, che dice a quale
 * lavoro andare a vedere. Vedi content/seeking.ts per il perche'.
 *
 * `seekingRoutes` non e' cambiato con la casella: sono sempre le stesse cinque
 * forme di intervento, nello stesso ordine e con le stesse prove. E' cambiato
 * come si guardano — da strade a mail — e quello sta tutto nei testi e nel
 * componente.
 */
export async function Seeking() {
  const t = await getTranslations("seeking");

  const mail: SeekingMail[] = seekingRoutes.map((r) => ({
    id: r.id,
    nome: t(`list.${r.id}.nome`),
    oggetto: t(`list.${r.id}.oggetto`),
    anteprima: t(`list.${r.id}.anteprima`),
    et: t(`list.${r.id}.et`),
    titolo: t(`list.${r.id}.titolo`),
    etPrima: t(`list.${r.id}.etPrima`),
    prima: t(`list.${r.id}.prima`),
    tipo: t(`list.${r.id}.tipo`),
    cta: t(`list.${r.id}.cta`),
    // Il buco nelle traduzioni di «non ancora» e' voluto, come per il post-it
    // bianco del tavolo: non ha una prova, e cercargliela solleverebbe.
    prova: r.prova ? { testo: t(`list.${r.id}.prova`), ancora: r.prova.ancora } : null,
  }));

  return (
    <SeekingView
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      attesa={t("attesa")}
      etichettaTipo={t("labels.tipo")}
      casella={{
        etichettaDa: t("casella.etichettaDa"),
        etichettaA: t("casella.etichettaA"),
        da: t("casella.da"),
        a: t("casella.a"),
        vuoto: t("casella.vuoto"),
        firma: t("casella.firma"),
        ruolo: t("casella.ruolo"),
      }}
      mail={mail}
    />
  );
}
