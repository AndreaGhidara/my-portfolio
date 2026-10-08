import { Reveal } from "@/animations/components/Reveal";
import { ContactForm, type ContactFormCopy } from "./ContactForm";

/** Un momento di quello che succede dopo l'invio. L'ordine è nel tempo. */
export type ContactMoment = { id: string; when: string; title: string; text: string };

export type ContactViewProps = {
  eyebrow: string;
  title: string;
  client: { eyebrow: string; title: string; body: string };
  after: { label: string; moments: ContactMoment[] };
  recruiter: {
    eyebrow: string;
    title: string;
    body: string;
    cv: string;
    linkedin: string;
    github: string;
  };
  cvPath: string;
  /** L'indirizzo vero: il modulo lo mostra quando l'invio fallisce. */
  email: string;
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
  after,
  recruiter,
  cvPath,
  email,
  socials,
  form,
}: ContactViewProps) {
  const urlFor = (id: string) => socials.find((social) => social.id === id)?.url ?? "#";

  return (
    <section id="contact" aria-labelledby="titolo-contact" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <div className="mx-auto max-w-[56rem]">
        <Reveal motion="dietro" stagger={0.08}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="titolo-contact" className="section-title">{title}</h2>
        </Reveal>

        {/* Il foglio e il cartellino entrano uno dopo l'altro, e l'attributo
            resta qui: `[data-contact-due]` e' la griglia a due colonne. */}
        <Reveal data-contact-columns motion="dietro" stagger={0.12}>
          {/* Il foglio: quello che scrivi finisce su una cosa che qualcuno
              legge, non dentro un sistema. Le righe al posto dei riquadri sono
              tutto quello che serve a dirlo. */}
          <div data-contact-sheet>
            <p data-contact-sheet-label>{client.eyebrow}</p>
            <h3>{client.title}</h3>
            <p data-contact-sheet-text>{client.body}</p>
            <ContactForm copy={form} email={email} />
          </div>

          <div>
            <p data-contact-after-label>{after.label}</p>
            {/* Ordinata: i tre momenti hanno un ordine nel tempo, e non e' una
                scelta di impaginato. */}
            <ol data-contact-times>
              {after.moments.map((moment) => (
                <li key={moment.id}>
                  <span data-contact-when>{moment.when}</span>
                  <div>
                    <b>{moment.title}</b>
                    <p>{moment.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        {/* Il cartellino entra dopo il foglio: e' la seconda uscita, e la
            sequenza dice quale delle due e' la principale. */}
        <Reveal data-contact-badge motion="alto" delay={0.05}>
          <span data-contact-clip aria-hidden="true" />
          <div data-contact-badge-body>
            <div>
              <p data-contact-badge-label>{recruiter.eyebrow}</p>
              <h3>{recruiter.title}</h3>
              <p data-contact-badge-text>{recruiter.body}</p>
            </div>

            <div data-contact-badge-drawn>
              <a href={cvPath} download data-contact-cta="solid">
                {recruiter.cv}
              </a>
              <a
                href={urlFor("linkedin")}
                target="_blank"
                rel="noopener noreferrer"
                data-contact-cta="outline"
              >
                {recruiter.linkedin}
              </a>
              <a
                href={urlFor("github")}
                target="_blank"
                rel="noopener noreferrer"
                data-contact-cta="outline"
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
