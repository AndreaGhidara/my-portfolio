"use server";

import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function sendEmail(formData: FormData) {
  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
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
    const { data, error } = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: 'andrea.ghidara.dev@gmail.com',
      subject: `New message from ${name} via Portfolio`,
      replyTo: email,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    console.log(data);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send email.' };
  }
}