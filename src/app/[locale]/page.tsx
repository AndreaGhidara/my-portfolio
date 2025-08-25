import Hero from "@/components/organisms/Hero";
import Projects from "@/components/organisms/Projects";
import Experiences from "@/components/organisms/Experiences";
import ContactMe from "@/components/organisms/ContactMe";
import Footer from "@/components/organisms/Footer";

export default function Home() {
  return (
    <div>
      <Hero />
      <div className="">
        <Projects />
      </div>
      {/*<div>
        <Experiences />
      </div>*/}
      <div>
        <ContactMe />
      </div>
      <Footer />
    </div>
  );
}
