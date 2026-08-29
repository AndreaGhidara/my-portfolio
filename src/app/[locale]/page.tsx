import { Hero } from "@/components/sections/Hero";
import { Pact } from "@/components/sections/Pact";
import { Services } from "@/components/sections/Services";
import { Works } from "@/components/sections/Works";
import { Process } from "@/components/sections/Process";
import { Journey } from "@/components/sections/Journey";
import { Contact } from "@/components/sections/Contact";

/**
 * L'ordine è quello deciso nella spec e non è arbitrario:
 * il patto sta al secondo posto perché la fiducia va costruita prima di
 * chiedere attenzione, e i servizi vengono prima dei lavori perché chi
 * arriva da cliente vuole sapere se fai la cosa che gli serve prima di
 * guardare cosa hai fatto per altri.
 *
 * Il Footer non è qui: vive nel layout, fuori da <main>, perché è chrome
 * di sito (come la Navbar) e un <footer> dentro <main> perde il ruolo
 * implicito contentinfo per HTML-AAM.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Pact />
      <Services />
      <Works />
      <Process />
      <Journey />
      <Contact />
    </>
  );
}
