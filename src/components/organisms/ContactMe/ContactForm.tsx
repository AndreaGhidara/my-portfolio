"use client";

import { useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendEmail } from "@/actions/sendEmail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

type ContactFormTranslations = {
  labels: { name: string; email: string; message: string };
  placeholders: { email: string; message: string };
  button: { sending: string; default: string };
  status: { success: string; error: string };
  errors: {
    nameRequired: string; nameMin: string;
    emailRequired: string; emailInvalid: string;
    messageRequired: string; messageMin: string;
  };
};

type ContactFormProps = {
  translations: ContactFormTranslations;
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};
const statusMessageVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export default function ContactForm({ translations }: ContactFormProps) {
  const contactFormSchema = useMemo(() => z.object({
    name: z.string()
      .nonempty({ message: translations.errors.nameRequired })
      .min(2, { message: translations.errors.nameMin }),
    email: z.string()
      .nonempty({ message: translations.errors.emailRequired })
      .email({ message: translations.errors.emailInvalid }),
    message: z.string()
      .nonempty({ message: translations.errors.messageRequired })
      .min(10, { message: translations.errors.messageMin }),
  }), [translations]);

  type ContactFormInputs = z.infer<typeof contactFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");

  const processForm: SubmitHandler<ContactFormInputs> = async (data) => {
    setSubmissionStatus("idle");
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));

    const result = await sendEmail(formData);

    if (result.success) {
      setSubmissionStatus("success");
      reset();
    } else {
      setSubmissionStatus("error");
    }
  };

  return (
    <motion.div className="flex justify-center" variants={itemVariants}>
      <Card className="relative w-full overflow-hidden max-w-2xl">
        <form onSubmit={handleSubmit(processForm)}>
          <CardContent className="space-y-6 pt-6">
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">{translations.labels.name}</Label>
              <Input id="name" type="text" autoComplete="name" {...register("name")} placeholder="Mario Rossi" />
              <AnimatePresence>
                {errors.name && (
                  <motion.p className="text-sm text-red-500" variants={statusMessageVariants} initial="hidden" animate="visible" exit="exit">
                    {errors.name.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{translations.labels.email}</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} placeholder={translations.placeholders.email} />
              <AnimatePresence>
                {errors.email && (
                  <motion.p className="text-sm text-red-500" variants={statusMessageVariants} initial="hidden" animate="visible" exit="exit">
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {/* Campo Messaggio */}
            <div className="space-y-2">
              <Label htmlFor="message">{translations.labels.message}</Label>
              <Textarea id="message" rows={4} {...register("message")} placeholder={translations.placeholders.message} />
              <AnimatePresence>
                {errors.message && (
                  <motion.p className="text-sm text-red-500" variants={statusMessageVariants} initial="hidden" animate="visible" exit="exit">
                    {errors.message.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-4 pt-10">
            <motion.div
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer"
              >
                {isSubmitting ? translations.button.sending : translations.button.default}
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              {submissionStatus === "success" && (
                <motion.p
                  key="success"
                  className="text-sm text-green-600 dark:text-green-400"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={statusMessageVariants}
                >
                  {translations.status.success}
                </motion.p>
              )}
              {submissionStatus === "error" && (
                <motion.p
                  key="error"
                  className="text-sm text-red-600 dark:text-red-500"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={statusMessageVariants}
                >
                  {translations.status.error}
                </motion.p>
              )}
            </AnimatePresence>
          </CardFooter>
        </form>
        <BorderBeam duration={8} size={100} />
      </Card>
    </motion.div>
  );
}