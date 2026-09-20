"use client";

import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendEmail } from "@/actions/sendEmail";

export type ContactFormCopy = {
  labels: { name: string; email: string; message: string };
  placeholders: { name: string; email: string; message: string };
  button: { default: string; sending: string };
  status: { success: string; error: string };
  errors: {
    nameRequired: string; nameMin: string;
    emailRequired: string; emailInvalid: string;
    messageRequired: string; messageMin: string;
  };
};

/**
 * Il segno dell'esito. Sta fuori dal testo e con aria-hidden: la regione viva
 * annuncia quello che LEGGE, e un'icona annunciata sarebbe rumore. Serve
 * perche' il colore da solo non basta a dire com'e' andata — c'e' chi non lo
 * distingue, e c'e' chi guarda lo schermo di sbieco al sole.
 */
function SegnoEsito({ esito }: { esito: "success" | "error" }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {esito === "success" ? (
        <path
          d="M6 10.4l2.6 2.6L14.2 7.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10 5.8v5M10 13.6v.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/**
 * I campi non sono piu' riquadri ma righe su cui si scrive, e il vestito sta
 * in tokens.css: un campo senza contorno ha due cose da difendere che una
 * scatola dava gratis, il fuoco della tastiera e la dimensione del bersaglio
 * sotto il pollice. Due prove le verificano nel foglio di stile, perche' nel
 * DOM non si vedono.
 */
export function ContactForm({ copy, email }: { copy: ContactFormCopy; email: string }) {
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().nonempty(copy.errors.nameRequired).min(2, copy.errors.nameMin),
        email: z.string().nonempty(copy.errors.emailRequired).email(copy.errors.emailInvalid),
        message: z.string().nonempty(copy.errors.messageRequired).min(10, copy.errors.messageMin),
      }),
    [copy],
  );

  type Inputs = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Inputs>({ resolver: zodResolver(schema) });

  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setState("idle");
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));

    const result = await sendEmail(formData);
    if (result.success) {
      setState("success");
      reset();
    } else {
      setState("error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="name" data-contact-etichetta>
          {copy.labels.name}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={copy.placeholders.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          data-contact-campo
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" data-contact-errore>{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" data-contact-etichetta>
          {copy.labels.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={copy.placeholders.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          data-contact-campo
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" data-contact-errore>{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" data-contact-etichetta>
          {copy.labels.message}
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder={copy.placeholders.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          data-contact-campo
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" data-contact-errore>{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        data-contact-invia
      >
        {isSubmitting ? copy.button.sending : copy.button.default}
      </button>

      {/* role=status annuncia l'esito senza rubare il focus: chi usa uno
          screen reader sa se il messaggio e' partito.

          Era una riga grigia di 13px sotto il bottone, e chi scriveva non si
          accorgeva di aver mandato niente: premeva, non succedeva niente di
          visibile, e restava li' a chiedersi se il modulo fosse rotto. Adesso
          e' un riquadro con un segno e un colore.

          L'elemento resta nel DOM anche da fermo — vuoto, ma presente: una
          regione viva che nasce nel momento in cui ha qualcosa da dire, certi
          screen reader non la leggono affatto.

          Quando qualcosa non parte, l'indirizzo e' li' e si puo' cliccare: un
          errore che dice "scrivimi via email" senza dare l'email lascia la
          persona a cercarsela, ed e' il momento in cui se ne va. */}
      <p role="status" aria-live="polite" data-contact-esito data-esito={state}>
        {state !== "idle" && <SegnoEsito esito={state} />}
        <span>
          {state === "success" ? copy.status.success : state === "error" ? copy.status.error : ""}
          {state === "error" && (
            <>
              {" "}
              <a href={`mailto:${email}`} data-contact-esito-via>
                {email}
              </a>
            </>
          )}
        </span>
      </p>
    </form>
  );
}
