"use client";

import { useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendEmail } from "@/actions/sendEmail";
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
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";



export default function ContactMe() {
  const t = useTranslations("contact");

  const contactFormSchema = useMemo(() => z.object({
    name: z.string()
      .nonempty({ message: t("errors.nameRequired") })
      .min(2, { message: t("errors.nameMin") }),
    email: z.string()
      .nonempty({ message: t("errors.emailRequired") })
      .email({ message: t("errors.emailInvalid") }),
    message: z.string()
      .nonempty({ message: t("errors.messageRequired") })
      .min(10, { message: t("errors.messageMin") }),
  }), [t]);
  type ContactFormInputs = z.infer<typeof contactFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const statusMessageVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  };

  return (
    <section id={"contact"} className="flex min-h-screen w-full items-center justify-center p-4 md:p-8">
      <motion.div
        className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-1"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="flex flex-col justify-center text-center lg:text-center"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div className="flex justify-center" variants={itemVariants}>
          <Card className="relative w-full overflow-hidden max-w-2xl">
            <form onSubmit={handleSubmit(processForm)}>
              <CardHeader>
                <CardTitle hidden></CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t("labels.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    {...register("name")}
                    placeholder="Mario Rossi"
                  />
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        className="text-sm text-red-500"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={statusMessageVariants}
                      >
                        {errors.name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("labels.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder={t("placeholders.email")}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        className="text-sm text-red-500"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={statusMessageVariants}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message">{t("labels.message")}</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    {...register("message")}
                    placeholder={t("placeholders.message")}
                  />
                  <AnimatePresence>
                    {errors.message && (
                      <motion.p
                        className="text-sm text-red-500"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={statusMessageVariants}
                      >
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
                    {isSubmitting ? t("button.sending") : t("button.default")}
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
                      {t("status.success")}
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
                      {t("status.error")}
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardFooter>
            </form>
            <BorderBeam duration={8} size={100} />
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}
