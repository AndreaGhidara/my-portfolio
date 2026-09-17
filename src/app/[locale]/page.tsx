import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Seeking } from "@/components/sections/Seeking";
import { Services } from "@/components/sections/Services";
import { Works } from "@/components/sections/Works";
import { Process } from "@/components/sections/Process";
import { Journey } from "@/components/sections/Journey";
import { Contact } from "@/components/sections/Contact";

/**
 * L'ordine è quello deciso nella spec e non è arbitrario:
 * al secondo posto sta il riconoscimento — cinque richieste che il visitatore
 * si e' gia' detto — e subito dopo la risposta a quelle frasi, nello stesso
 * ordine. Prima si fa dire "questo sono io", poi si spiega come si risolve:
 * invertirli significa descrivere una soluzione a chi non ha ancora ammesso
 * di avere il problema. I lavori vengono dopo, perche' servono a dimostrare
 * quello che i primi due blocchi hanno promesso.
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
      <Hero />
      <Seeking />
      <Services />
      <Works />
      <Process />
      <Journey />
      <Contact />
    </>
  );
}
