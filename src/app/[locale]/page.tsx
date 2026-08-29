/**
 * Le sezioni vengono aggiunte una alla volta dai task successivi,
 * nell'ordine deciso nella spec. Il montaggio finale e i metadati
 * sono nel Task 16.
 */
import { Hero } from "@/components/sections/Hero";
import { Pact } from "@/components/sections/Pact";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";

export default function Home() {
  return (
    <>
      <Hero />
      <Pact />
      <Services />
      <Process />
    </>
  );
}
