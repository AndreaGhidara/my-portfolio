import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactView, type ContactViewProps } from "../ContactView";
import { sendEmail } from "@/actions/sendEmail";
import { rules } from "@/test/css";

/* La server action non parte davvero in una prova: qui si sta verificando
   cosa VEDE chi ha premuto invia, non se Resend consegna. */
vi.mock("@/actions/sendEmail", () => ({ sendEmail: vi.fn() }));
const sendEmailMock = vi.mocked(sendEmail);

/** Compila i tre campi e preme invia. */
async function fillAndSend(outcome: { success: boolean }) {
  sendEmailMock.mockResolvedValue(outcome);
  render(<ContactView {...props} />);
  await userEvent.type(screen.getByLabelText(props.form.labels.name), "Mario Rossi");
  await userEvent.type(screen.getByLabelText(props.form.labels.email), "mario@esempio.it");
  await userEvent.type(
    screen.getByLabelText(props.form.labels.message),
    "Ciao Andrea, ho un'attivita' e mi servirebbe un sito.",
  );
  await userEvent.click(screen.getByRole("button", { name: props.form.button.default }));
}

const props: ContactViewProps = {
  eyebrow: "Contatti",
  title: "Il tuo turno",
  client: {
    eyebrow: "Ho un progetto",
    title: "Raccontami cosa ti serve",
    body: "Due righe bastano.",
  },
  after: {
    label: "Cosa succede dopo",
    moments: [
      { id: "risposta", when: "Entro 24 ore", title: "Una risposta", text: "Anche se è no." },
      { id: "chiamata", when: "Se ci sentiamo", title: "Mezz'ora", text: "Senza impegno." },
      { id: "preventivo", when: "Solo dopo", title: "Due pagine", text: "E i numeri." },
    ],
  },
  recruiter: {
    eyebrow: "L'altra uscita",
    title: "Mi stai valutando per un ruolo?",
    body: "Allora non ti serve un modulo.",
    cv: "Scarica il CV",
    linkedin: "LinkedIn",
    github: "GitHub",
  },
  cvPath: "/cv/Andrea_Ghidara_CV_2026.pdf",
  email: "andrea.ghidara.dev@gmail.com",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ],
  form: {
    labels: { name: "Come ti chiami", email: "La tua email", message: "Cosa ti serve" },
    placeholders: { name: "Mario Rossi", email: "mario@esempio.it", message: "Ciao Andrea…" },
    button: { default: "Invia messaggio", sending: "Invio in corso…" },
    status: { success: "Messaggio ricevuto.", error: "Qualcosa è andato storto." },
    errors: {
      nameRequired: "Serve un nome.", nameMin: "Almeno 2 caratteri.",
      emailRequired: "Serve un'email.", emailInvalid: "Email non valida.",
      messageRequired: "Scrivi due righe.", messageMin: "Almeno 10 caratteri.",
    },
  },
};

describe("ContactView", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<ContactView {...props} />);
    const section = screen.getByRole("region", { name: props.title });
    const heading = within(section).getByRole("heading", { level: 2, name: props.title });
    expect(section).toHaveAttribute("aria-labelledby", heading.id);
    expect(heading).toHaveClass("section-title");
  });
  it("i due pubblici restano distinti, ma non sono più due colonne pari", () => {
    // Il cliente ha metà pagina e un foglio su cui scrivere; chi assume ha una
    // riga sola e un tesserino. Erano due colonne uguali fra cui scegliere:
    // adesso una è il posto dove si scrive e l'altra è una cosa che trovi dopo.
    const { container } = render(<ContactView {...props} />);
    expect(screen.getByRole("heading", { name: props.client.title })).toBeInTheDocument();
    const badge = container.querySelector("[data-contact-badge]");
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent(props.recruiter.title);
    expect(container.querySelector("[data-contact-sheet] form")).not.toBeNull();
  });

  it("«cosa succede dopo» è una sequenza, e il markup lo dice", () => {
    // I tre momenti hanno un ordine nel tempo: entro 24 ore, poi la chiamata,
    // poi il preventivo. Una <ol> è il modo in cui quell'ordine arriva anche a
    // chi la pagina non la vede.
    const { container } = render(<ContactView {...props} />);
    const items = container.querySelectorAll("ol[data-contact-times] > li");
    expect(items).toHaveLength(props.after.moments.length);
    expect(items[0]).toHaveTextContent(props.after.moments[0].when);
    expect(items[items.length - 1]).toHaveTextContent("Due pagine");
  });

  it("l'uscita per chi assume porta al CV con download esplicito", () => {
    render(<ContactView {...props} />);
    const cv = screen.getByRole("link", { name: props.recruiter.cv });
    expect(cv).toHaveAttribute("href", props.cvPath);
    expect(cv).toHaveAttribute("download");
  });

  it("l'uscita per chi assume porta a LinkedIn e GitHub", () => {
    render(<ContactView {...props} />);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", props.socials[0].url);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", props.socials[1].url);
  });

  it("il form ha tre campi, non sei: ogni campo in più è gente che se ne va", () => {
    render(<ContactView {...props} />);
    expect(screen.getByLabelText(props.form.labels.name)).toBeInTheDocument();
    expect(screen.getByLabelText(props.form.labels.email)).toBeInTheDocument();
    expect(screen.getByLabelText(props.form.labels.message)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
  });

  it("l'esito dell'invio è annunciato alla tecnologia assistiva", () => {
    render(<ContactView {...props} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("ogni campo invalido è associato al proprio messaggio d'errore", async () => {
    render(<ContactView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: props.form.button.default }));
    const nameField = screen.getByLabelText(props.form.labels.name);
    expect(nameField).toHaveAttribute("aria-invalid", "true");
    expect(nameField).toHaveAccessibleDescription(props.form.errors.nameRequired);
  });

  it("la griglia a due colonne resta l'elemento che contiene foglio e momenti", () => {
    // `[data-contact-due]` e' la griglia: l'entrata avvolge quell'elemento
    // stesso, non ci si infila dentro, o le due colonne tornano una sotto
    // l'altra su ogni schermo.
    const { container } = render(<ContactView {...props} />);
    const grid = container.querySelector("[data-contact-columns]");
    expect(grid).not.toBeNull();
    expect(grid!.querySelector("[data-contact-sheet]")).not.toBeNull();
    expect(grid!.querySelector("[data-contact-times]")).not.toBeNull();
  });
});

describe("i campi sono righe, non riquadri", () => {
  const fieldRules = rules(/\[data-contact-field\]/);

  it("un campo senza bordo ha comunque un fuoco che si vede", () => {
    // È il prezzo della riga al posto della scatola: tolto il contorno, il
    // fuoco della tastiera resta l'unica cosa che dice dove sei, e senza una
    // regola esplicita il browser non ne disegna nessuno su un campo così.
    const focus = fieldRules.find((r) => /:focus-visible/.test(r.selector));
    expect(focus, "manca la regola di fuoco sui campi").toBeDefined();
    expect(focus!.body).toMatch(/outline:[^;]*var\(--accent\)/);
  });

  it("il campo resta grande abbastanza da poterlo toccare", () => {
    // Una riga e' alta quanto il testo. Su un telefono si tocca con il pollice,
    // e sotto i 44px il bersaglio e' troppo piccolo: la min-height e' quello
    // che una scatola dava gratis e una riga no.
    const base = fieldRules.find((r) => r.selector === "[data-contact-field]");
    expect(base, "manca la regola base dei campi").toBeDefined();
    expect(base!.body).toMatch(/min-height:\s*2\.75rem/);
  });
});

describe("le etichette arancioni si leggono", () => {
  // Sono le micro etichette in monospaziato sopra ogni blocco: "Ho un
  // progetto", "Entro 24 ore", "L'altra uscita". Stanno tutte sotto i 12px, e
  // l'arancio pieno su carta fa 3,27:1, sotto il 4,5:1 che WCAG chiede al
  // testo piccolo. --accento-testo e' lo stesso arancio scurito quel tanto che
  // basta (5,42:1), e sul tema scuro torna pieno perche' li' il problema non
  // c'e'.
  const labels = [
    "[data-contact-sheet-label]",
    "[data-contact-when]",
    "[data-contact-badge-label]",
  ];

  it.each(labels)("%s non usa l'arancio pieno come testo", (selector) => {
    const rule = rules(selector)[0];
    expect(rule, `manca la regola ${selector}`).toBeDefined();
    expect(rule!.body).toMatch(/color:\s*var\(--accent-text\)/);
  });

  it("il testo del cartellino non e' spento: su quel fondo il grigio faceva 4,22:1", () => {
    // Il cartellino ha un fondo suo, piu' scuro della carta di pagina
    // (color-mix con --fg al 7%): li' --fg-muted scendeva sotto il 4,5:1
    // richiesto al testo piccolo. Il paragrafo passa a --fg.
    const rule = rules("[data-contact-badge-text]")[0];
    expect(rule, "manca la regola del testo del cartellino").toBeDefined();
    expect(rule!.body).toMatch(/color:\s*var\(--fg\)/);
  });

  it("l'arancio da testo esiste in tutti e due i temi", () => {
    const root = rules(":root")[0];
    const dark = rules('[data-theme="dark"]')[0];
    expect(root!.body).toMatch(/--accent-text:/);
    expect(dark!.body).toMatch(/--accent-text:/);
  });
});

describe("l'esito dell'invio", () => {
  beforeEach(() => sendEmailMock.mockReset());

  it("si vede, e non e' piu' una riga grigia sotto il bottone", async () => {
    // Era `color: var(--fg-muted)` a 0.85rem: il messaggio partiva davvero, ma
    // chi premeva non vedeva cambiare niente e restava a chiedersi se il
    // modulo fosse rotto. Lo stato sta nell'attributo perche' e' da li' che il
    // foglio di stile costruisce il riquadro.
    await fillAndSend({ success: true });
    const outcome = await screen.findByRole("status");
    expect(outcome).toHaveAttribute("data-outcome", "success");
    expect(outcome).toHaveTextContent(props.form.status.success);
    // Il segno accanto al testo: chi non distingue l'arancio dall'inchiostro
    // deve capirlo lo stesso, e il colore da solo non glielo dice.
    expect(outcome.querySelector("svg")).not.toBeNull();
    expect(outcome.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("quando qualcosa non parte, l'indirizzo e' li' e si puo' cliccare", async () => {
    // Un errore che dice "scrivimi via email" senza dare l'email lascia la
    // persona a cercarsela: e' esattamente il momento in cui se ne va.
    await fillAndSend({ success: false });
    const outcome = await screen.findByRole("status");
    expect(outcome).toHaveAttribute("data-outcome", "error");
    expect(outcome).toHaveTextContent(props.form.status.error);
    expect(outcome.querySelector("a")).toHaveAttribute("href", `mailto:${props.email}`);
  });

  it("la regione viva c'e' anche da ferma, o certi screen reader non la leggono", () => {
    // Una regione che NASCE nel momento in cui ha qualcosa da dire, per certi
    // lettori di schermo non esiste: va gia' trovata nel documento, vuota.
    render(<ContactView {...props} />);
    const outcome = screen.getByRole("status");
    expect(outcome).toHaveAttribute("data-outcome", "idle");
    expect(outcome).toHaveTextContent("");
  });
});
