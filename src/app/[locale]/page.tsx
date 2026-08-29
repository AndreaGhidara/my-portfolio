/**
 * Le sezioni vengono aggiunte una alla volta dai task successivi,
 * nell'ordine deciso nella spec. Il montaggio finale e i metadati
 * sono nel Task 16.
 */
import { Hero } from "@/components/sections/Hero";

export default function Home() {
  return (
    <>
      <Hero />
    </>
  );
}
