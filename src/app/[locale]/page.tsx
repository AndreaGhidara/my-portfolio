import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { SottoIlFoglio } from "@/components/sections/Hero/SottoIlFoglio";
import { Scontrino } from "@/components/sections/Scontrino";
import { Services } from "@/components/sections/Services";
import { Works } from "@/components/sections/Works";
import { Journey } from "@/components/sections/Journey";
import { Notizie } from "@/components/sections/Notizie";
import { Contact } from "@/components/sections/Contact";

/**
 * Al secondo posto la stampante dei servizi: si sceglie un servizio e si vede
 * di che pezzi e' fatto. Poi il tavolo, tutto quello che sta sotto un sito
 * finito, e i lavori, che servono a dimostrare quello che i primi blocchi hanno
 * promesso. Poi il percorso, dove ho imparato, le notizie della settimana, e
 * in fondo «Il tuo turno», i contatti. «Come lavoro» (Process) stava fra i
 * lavori e il percorso: e' nascosta per scelta, non tolta.
 *
 * Il Footer non è qui: vive nel layout, fuori da <main>, perché è chrome
 * di sito (come la Navbar) e un <footer> dentro <main> perde il ruolo
 * implicito contentinfo per HTML-AAM.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Come nel layout: senza, la pagina torna dinamica e si ricostruisce a ogni
  // richiesta. Va chiamata in ogni file che sta sotto [locale].
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {/* Insieme, e solo loro: Hero si ferma e la stampante gli passa sopra, e lo
          sticky di Hero finisce dove finisce questo contenitore. Dentro <main>
          resterebbe incollato dietro tutte le sezioni fino in fondo. */}
      <SottoIlFoglio>
        <Hero />
        <Scontrino />
      </SottoIlFoglio>
      <Services />
      <Works />
      {/* «Come possiamo proseguire» (Process) e' nascosta per scelta, non tolta:
          componente, testi e prove restano. Per rimetterla basta riportare qui
          <Process /> (import da "@/components/sections/Process"). */}
      <Journey />
      <Notizie />
      <Contact />
    </>
  );
}
