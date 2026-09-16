"use server";

import { site } from "@/content/site";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function sendEmail(formData: FormData) {
  // estrai SEMPRE come stringhe
  const rawFormData = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const validationResult = contactFormSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid form data. Please check your entries.",
    };
  }

  const { name, email, message } = validationResult.data;

  try {
    const { error } = await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      // L'indirizzo sta in site.ts e non qui: e' la stessa regola del dominio.
      to: [site.email],
      subject: `New message from ${name} via Portfolio`,
      html: `
        <h1>Email from Portfolio</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email sending error:", err);
    return { success: false, error: "Failed to send email." };
  }
}

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
