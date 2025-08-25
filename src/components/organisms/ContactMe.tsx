"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendEmail } from '@/actions/sendEmail';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Textarea } from "@/components/ui/textarea";

const content = {
  title: "Get in Touch",
  subtitle: "Have a question or a project in mind? I'd love to hear from you. Fill out the form, and I'll get back to you as soon as possible.",
  labels: {
    name: "Name",
    email: "Email",
    message: "Message",
  },
  button: {
    default: "Send Message",
    sending: "Sending...",
  },
  status: {
    success: "Thank you! Your message has been sent successfully.",
    error: "Oops! Something went wrong. Please try again later.",
  }
};

const contactFormSchema = z.object({
  email: z.email("Invalid email address"),
  message: z.string().min(10, "Message is too short"),
});

type ContactFormInputs = z.infer<typeof contactFormSchema>;

export default function ContactMe() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const processForm: SubmitHandler<ContactFormInputs> = async (data) => {
    // Reset status on new submission
    setSubmissionStatus('idle');

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await sendEmail(formData);

    if (result.success) {
      setSubmissionStatus('success');
      reset();
    } else {
      setSubmissionStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">

        {/* COLONNA SINISTRA: Testo */}
        <div className="flex flex-col justify-center text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            {content.subtitle}
          </p>
        </div>

        {/* COLONNA DESTRA: Form Card */}
        <Card className="relative w-full overflow-hidden">
          <form onSubmit={handleSubmit(processForm)}>
            <CardHeader>
              <CardTitle hidden></CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">{content.labels.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Message Field - Usando il componente Textarea di shadcn/ui per coerenza */}
              <div className="space-y-2">
                <Label htmlFor="message">{content.labels.message}</Label>
                <Textarea
                  id="message"
                  rows={4}
                  {...register('message')}
                  placeholder="Tell me about your project or question..."
                />
                {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 pt-10">
              <Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
                {isSubmitting ? content.button.sending : content.button.default}
              </Button>

              {/* Messaggi di stato */}
              {submissionStatus === 'success' && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {content.status.success}
                </p>
              )}
              {submissionStatus === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-500">
                  {content.status.error}
                </p>
              )}
            </CardFooter>
          </form>
          <BorderBeam duration={8} size={100} />
        </Card>
      </div>
    </div>
  );
}