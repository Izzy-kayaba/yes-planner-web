"use client";

import { Check, Heart, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/ui/Brand";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

const rsvpSchema = z
  .object({
    response: z.enum(["yes", "no"]).optional(),
    mealPreference: z.string().optional(),
    dietaryNotes: z.string().max(500, "Please keep dietary notes under 500 characters."),
  })
  .superRefine((values, context) => {
    if (!values.response)
      context.addIssue({ code: "custom", path: ["response"], message: "Choose a response." });
    if (values.response === "yes" && !values.mealPreference) {
      context.addIssue({
        code: "custom",
        path: ["mealPreference"],
        message: "Choose a meal preference.",
      });
    }
  });

type RsvpValues = z.infer<typeof rsvpSchema>;

export function RsvpExperience() {
  const { text } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RsvpValues>({
    defaultValues: { response: undefined, mealPreference: "", dietaryNotes: "" },
  });
  const response = watch("response");

  function submit(values: RsvpValues) {
    const result = rsvpSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RsvpValues;
        if (field) setError(field, { type: "validate", message: issue.message });
      });
      return;
    }
    setSubmitted(true);
    toast.success(text("Your RSVP has been saved."));
  }

  if (submitted) {
    return (
      <main className="invite-layout">
        <div className="invite-art">
          <span>✦</span>
        </div>
        <section className="invite-card confirmation">
          <Brand />
          <span className="confirmation-mark">
            <Check size={28} />
          </span>
          <p className="eyebrow">{text("Response received")}</p>
          <h1>
            {response === "yes"
              ? text("We can’t wait to celebrate with you.")
              : text("Thank you for letting us know.")}
          </h1>
          <p>
            {text(
              "Amara and Sipho have received your response. You can return to this invitation at any time.",
            )}
          </p>
          <button className="button button-primary" onClick={() => setSubmitted(false)}>
            {text("Review my response")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="invite-layout">
      <div className="invite-art">
        <div className="invite-monogram">
          A<span>&</span>S
        </div>
        <div className="invite-date">18 · 10 · 2026</div>
        <div className="invite-botanical">✦</div>
      </div>
      <section className="invite-card">
        <Brand />
        <p className="eyebrow">{text("Together with their families")}</p>
        <h1>
          Amara <em>&</em> Sipho
        </h1>
        <p className="invite-lead">{text("joyfully invite you to celebrate their wedding")}</p>
        <div className="invitation-details">
          <div>
            <span>{text("Sunday")}</span>
            <strong>{text("18 October 2026")}</strong>
            <small>{text("Ceremony at 15:00")}</small>
          </div>
          <i />
          <div>
            <span>Shepstone Gardens</span>
            <strong>Johannesburg</strong>
            <small>{text("Dress: Garden formal")}</small>
          </div>
        </div>
        <form className="rsvp-form" onSubmit={handleSubmit(submit)} noValidate>
          <h2>{text("Will you be joining us?")}</h2>
          <div className="rsvp-choice">
            <button
              className={cn(response === "yes" && "selected")}
              type="button"
              aria-pressed={response === "yes"}
              onClick={() => setValue("response", "yes", { shouldValidate: true })}
            >
              <Heart size={19} />
              <strong>{text("Joyfully accepts")}</strong>
              <small>{text("I’ll be there")}</small>
            </button>
            <button
              className={cn(response === "no" && "selected")}
              type="button"
              aria-pressed={response === "no"}
              onClick={() => setValue("response", "no", { shouldValidate: true })}
            >
              <X size={19} />
              <strong>{text("Regretfully declines")}</strong>
              <small>{text("Celebrating from afar")}</small>
            </button>
          </div>
          {errors.response && (
            <p className="text-center text-xs text-vow-wine">
              {text(errors.response.message ?? "")}
            </p>
          )}
          {response === "yes" && (
            <div className="rsvp-details">
              <label>
                {text("Meal preference")}
                <select
                  {...register("mealPreference")}
                  aria-invalid={Boolean(errors.mealPreference)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {text("Select a meal")}
                  </option>
                  <option value="Standard menu">{text("Standard menu")}</option>
                  <option value="Vegetarian">{text("Vegetarian")}</option>
                  <option>Halaal</option>
                  <option value="Children’s menu">{text("Children’s menu")}</option>
                </select>
                {errors.mealPreference && (
                  <small className="text-vow-wine">
                    {text(errors.mealPreference.message ?? "")}
                  </small>
                )}
              </label>
              <label>
                {text("Dietary notes")}
                <textarea
                  {...register("dietaryNotes")}
                  aria-invalid={Boolean(errors.dietaryNotes)}
                  placeholder={text("Allergies or requirements we should know about")}
                />
                {errors.dietaryNotes && (
                  <small className="text-vow-wine">{text(errors.dietaryNotes.message ?? "")}</small>
                )}
              </label>
            </div>
          )}
          <button disabled={!response} className="button button-primary button-wide" type="submit">
            {text("Send my response →")}
          </button>
        </form>
        <p className="invite-footer">
          {text("Please reply by 28 September · Questions? Contact Lerato on +27 82 555 0124")}
        </p>
      </section>
    </main>
  );
}
