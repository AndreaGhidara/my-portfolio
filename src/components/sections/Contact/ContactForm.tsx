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
 * I campi non sono piu' riquadri ma righe su cui si scrive, e il vestito sta
 * in tokens.css: un campo senza contorno ha due cose da difendere che una
 * scatola dava gratis, il fuoco della tastiera e la dimensione del bersaglio
 * sotto il pollice. Due prove le verificano nel foglio di stile, perche' nel
 * DOM non si vedono.
 */
export function ContactForm({ copy }: { copy: ContactFormCopy }) {
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
          screen reader sa se il messaggio e' partito. */}
      <p role="status" aria-live="polite" data-contact-esito>
        {state === "success" ? copy.status.success : state === "error" ? copy.status.error : ""}
      </p>
    </form>
  );
}
