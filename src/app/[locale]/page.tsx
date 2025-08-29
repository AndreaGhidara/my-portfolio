import Hero from "@/components/organisms/Hero";
import Projects from "@/components/organisms/Projects";
import ContactMe from "@/components/organisms/ContactMe";
import Footer from "@/components/organisms/Footer";
import ReactLenis from "lenis/react";

export default function Home() {
  return (
    <>
      <ReactLenis
        root
        options={{
          duration: 1.2,
          smoothWheel: true,
        }}
      >
        <div>
          <Hero />
          <Projects />
          <ContactMe />
          <Footer />
        </div>
      </ReactLenis>
    </>
  );
}
