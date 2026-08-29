import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { ContactForm, type ContactFormCopy } from "./ContactForm";

export type ContactViewProps = {
  eyebrow: string;
  title: string;
  client: { title: string; body: string };
  recruiter: { title: string; body: string; cv: string; linkedin: string; github: string };
  cvPath: string;
  socials: { id: string; url: string }[];
  form: ContactFormCopy;
};

export function ContactView({
  eyebrow, title, client, recruiter, cvPath, socials, form,
}: ContactViewProps) {
  const urlFor = (id: string) => socials.find((social) => social.id === id)?.url ?? "#";

  return (
    <section id="contact" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="contact" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-4xl lg:text-6xl">{title}</h2>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Uscita cliente */}
          <div>
            <h3 className="text-2xl font-bold text-[var(--fg)]">{client.title}</h3>
            <p className="mt-2 text-[var(--fg-muted)]">{client.body}</p>
            <div className="mt-6">
              <ContactForm copy={form} />
            </div>
          </div>

          {/* Uscita HR */}
          <div className="lg:pt-2">
            <h3 className="text-2xl font-bold text-[var(--fg)]">{recruiter.title}</h3>
            <p className="mt-2 text-[var(--fg-muted)]">{recruiter.body}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={cvPath}
                download
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--on-accent)]"
              >
                {recruiter.cv}
              </a>
              <a
                href={urlFor("linkedin")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[var(--fg)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--fg)]"
              >
                {recruiter.linkedin}
              </a>
              <a
                href={urlFor("github")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[var(--fg)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--fg)]"
              >
                {recruiter.github}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
