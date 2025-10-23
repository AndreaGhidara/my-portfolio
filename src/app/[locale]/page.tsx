import ContactMe from "@/components/organisms/ContactMe";
import ReactLenis from "lenis/react";
import Index from "@/components/organisms/Hero";
import Projects from "@/components/organisms/Projects";
import Footer from "@/components/organisms/Footer";

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
          <Index />
          <Projects />
          <ContactMe />
          <Footer />
        </div>
      </ReactLenis>
    </>
  );
}
