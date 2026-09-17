import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { ContactForm, type ContactFormCopy } from "./ContactForm";

/** Un momento di quello che succede dopo l'invio. L'ordine è nel tempo. */
export type ContactMomento = { id: string; quando: string; titolo: string; testo: string };

export type ContactViewProps = {
  eyebrow: string;
  title: string;
  client: { eyebrow: string; title: string; body: string };
  dopo: { etichetta: string; momenti: ContactMomento[] };
  recruiter: {
    eyebrow: string;
    title: string;
    body: string;
    cv: string;
    linkedin: string;
    github: string;
  };
  cvPath: string;
  socials: { id: string; url: string }[];
  form: ContactFormCopy;
};

/**
 * L'ultima sezione, ed è quella dove i due pubblici si separano.
 *
 * Erano due colonne pari, e mettevano il visitatore davanti a una scelta
 * proprio nel momento in cui doveva solo scrivere. Adesso non sono più pari: il
 * cliente ha metà pagina e un foglio su cui scrivere, chi assume ha una riga
 * sola con un tesserino. Non è una porta da scegliere, è una cosa che trovi
 * dopo.
 *
 * Il tesserino non è una decorazione presa a caso: è l'oggetto di «Dove ho
 * imparato», e a chi valuta per un ruolo un badge lo si dà davvero. La pagina si
 * chiude con lo stesso oggetto con cui ha raccontato dove si è lavorato.
 *
 * Accanto al modulo c'è quello che nessun modulo dice: cosa succede dopo che
 * premi invia. È la sola cosa che toglie l'attrito vero, che non è la fatica di
 * compilare tre campi ma il non sapere dove va a finire quello che scrivi.
 */
export function ContactView({
  eyebrow,
  title,
  client,
  dopo,
  recruiter,
  cvPath,
  socials,
  form,
}: ContactViewProps) {
  const urlFor = (id: string) => socials.find((social) => social.id === id)?.url ?? "#";

  return (
    <section id="contact" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="contact" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-[56rem]">
        <Reveal moto="dietro" stagger={0.08}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 text-4xl lg:text-6xl">{title}</h2>
        </Reveal>

        {/* Il foglio e il cartellino entrano uno dopo l'altro, e l'attributo
            resta qui: `[data-contact-due]` e' la griglia a due colonne. */}
        <Reveal data-contact-due moto="dietro" stagger={0.12}>
          {/* Il foglio: quello che scrivi finisce su una cosa che qualcuno
              legge, non dentro un sistema. Le righe al posto dei riquadri sono
              tutto quello che serve a dirlo. */}
          <div data-contact-foglio>
            <p data-contact-foglio-et>{client.eyebrow}</p>
            <h3>{client.title}</h3>
            <p data-contact-foglio-testo>{client.body}</p>
            <ContactForm copy={form} />
          </div>

          <div>
            <p data-contact-dopo-et>{dopo.etichetta}</p>
            {/* Ordinata: i tre momenti hanno un ordine nel tempo, e non e' una
                scelta di impaginato. */}
            <ol data-contact-tempi>
              {dopo.momenti.map((momento) => (
                <li key={momento.id}>
                  <span data-contact-quando>{momento.quando}</span>
                  <div>
                    <b>{momento.titolo}</b>
                    <p>{momento.testo}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        {/* Il cartellino entra dopo il foglio: e' la seconda uscita, e la
            sequenza dice quale delle due e' la principale. */}
        <Reveal data-contact-badge moto="alto" delay={0.05}>
          <span data-contact-clip aria-hidden="true" />
          <div data-contact-badge-body>
            <div>
              <p data-contact-badge-et>{recruiter.eyebrow}</p>
              <h3>{recruiter.title}</h3>
              <p data-contact-badge-testo>{recruiter.body}</p>
            </div>

            <div data-contact-badge-uscite>
              <a href={cvPath} download data-contact-cta="pieno">
                {recruiter.cv}
              </a>
              <a
                href={urlFor("linkedin")}
                target="_blank"
                rel="noopener noreferrer"
                data-contact-cta="vuoto"
              >
                {recruiter.linkedin}
              </a>
              <a
                href={urlFor("github")}
                target="_blank"
                rel="noopener noreferrer"
                data-contact-cta="vuoto"
              >
                {recruiter.github}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
