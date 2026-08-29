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

const field =
  "mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-muted)]/70";

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
        <label htmlFor="name" className="text-sm font-semibold text-[var(--fg)]">
          {copy.labels.name}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={copy.placeholders.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={field}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm font-semibold text-[var(--fg)]">{errors.name.message}</p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--fg)]">
          {copy.labels.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={copy.placeholders.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={field}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm font-semibold text-[var(--fg)]">{errors.email.message}</p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="text-sm font-semibold text-[var(--fg)]">
          {copy.labels.message}
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder={copy.placeholders.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={field}
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm font-semibold text-[var(--fg)]">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 w-full rounded-full bg-[var(--fg)] px-6 py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--bg)] disabled:opacity-60"
      >
        {isSubmitting ? copy.button.sending : copy.button.default}
      </button>

      {/* role=status annuncia l'esito senza rubare il focus: chi usa uno
          screen reader sa se il messaggio e' partito. */}
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm text-[var(--fg-muted)]">
        {state === "success" ? copy.status.success : state === "error" ? copy.status.error : ""}
      </p>
    </form>
  );
}
