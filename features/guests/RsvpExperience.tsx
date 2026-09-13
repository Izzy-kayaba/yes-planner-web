"use client";

import { Check, Heart, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/ui/Brand";
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
    toast.success("Your RSVP has been saved.");
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
          <p className="eyebrow">Response received</p>
          <h1>
            {response === "yes"
              ? "We can’t wait to celebrate with you."
              : "Thank you for letting us know."}
          </h1>
          <p>
            Amara and Sipho have received your response. You can return to this invitation at any
            time.
          </p>
          <button className="button button-primary" onClick={() => setSubmitted(false)}>
            Review my response
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
        <p className="eyebrow">Together with their families</p>
        <h1>
          Amara <em>&</em> Sipho
        </h1>
        <p className="invite-lead">joyfully invite you to celebrate their wedding</p>
        <div className="invitation-details">
          <div>
            <span>Sunday</span>
            <strong>18 October 2026</strong>
            <small>Ceremony at 15:00</small>
          </div>
          <i />
          <div>
            <span>Shepstone Gardens</span>
            <strong>Johannesburg</strong>
            <small>Dress: Garden formal</small>
          </div>
        </div>
        <form className="rsvp-form" onSubmit={handleSubmit(submit)} noValidate>
          <h2>Will you be joining us?</h2>
          <div className="rsvp-choice">
            <button
              className={cn(response === "yes" && "selected")}
              type="button"
              aria-pressed={response === "yes"}
              onClick={() => setValue("response", "yes", { shouldValidate: true })}
            >
              <Heart size={19} />
              <strong>Joyfully accepts</strong>
              <small>I’ll be there</small>
            </button>
            <button
              className={cn(response === "no" && "selected")}
              type="button"
              aria-pressed={response === "no"}
              onClick={() => setValue("response", "no", { shouldValidate: true })}
            >
              <X size={19} />
              <strong>Regretfully declines</strong>
              <small>Celebrating from afar</small>
            </button>
          </div>
          {errors.response && (
            <p className="text-center text-xs text-vow-wine">{errors.response.message}</p>
          )}
          {response === "yes" && (
            <div className="rsvp-details">
              <label>
                Meal preference
                <select
                  {...register("mealPreference")}
                  aria-invalid={Boolean(errors.mealPreference)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a meal
                  </option>
                  <option>Standard menu</option>
                  <option>Vegetarian</option>
                  <option>Halaal</option>
                  <option>Children’s menu</option>
                </select>
                {errors.mealPreference && (
                  <small className="text-vow-wine">{errors.mealPreference.message}</small>
                )}
              </label>
              <label>
                Dietary notes
                <textarea
                  {...register("dietaryNotes")}
                  aria-invalid={Boolean(errors.dietaryNotes)}
                  placeholder="Allergies or requirements we should know about"
                />
                {errors.dietaryNotes && (
                  <small className="text-vow-wine">{errors.dietaryNotes.message}</small>
                )}
              </label>
            </div>
          )}
          <button disabled={!response} className="button button-primary button-wide" type="submit">
            Send my response →
          </button>
        </form>
        <p className="invite-footer">
          Please reply by 28 September · Questions? Contact Lerato on +27 82 555 0124
        </p>
      </section>
    </main>
  );
}
