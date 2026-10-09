import { Reveal } from "@/animations/components/Reveal";
import { ContactForm, type ContactFormCopy } from "./ContactForm";

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
  /** Il modulo lo mostra quando l'invio fallisce. */
  email: string;
  socials: { id: string; url: string }[];
  form: ContactFormCopy;
};

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
    <section id="contact" aria-labelledby="contact-title" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <div className="mx-auto max-w-[56rem]">
        <Reveal motion="behind" stagger={0.08}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="contact-title" className="section-title">{title}</h2>
        </Reveal>

        {/* L'attributo resta sull'entrata: `[data-contact-columns]` e' la griglia
            a due colonne. */}
        <Reveal data-contact-columns motion="behind" stagger={0.12}>
          <div data-contact-sheet>
            <p data-contact-sheet-label>{client.eyebrow}</p>
            <h3>{client.title}</h3>
            <p data-contact-sheet-text>{client.body}</p>
            <ContactForm copy={form} email={email} />
          </div>

          <div>
            <p data-contact-after-label>{after.label}</p>
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

        {/* Il cartellino entra dopo il foglio: la sequenza dice quale delle due
            uscite e' la principale. */}
        <Reveal data-contact-badge motion="above" delay={0.05}>
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
