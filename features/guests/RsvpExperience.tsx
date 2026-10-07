"use client";

import { Check, Heart, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/ui/Brand";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { YesSelect } from "@/components/ui/YesSelect";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { apiRequest } from "@/lib/api/client";
import { getInitials } from "@/lib/initials";
import { formatDate } from "@/lib/date-time";

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

export function RsvpExperience({
  token,
  guestName,
  coupleName,
  weddingDate,
  venue,
  location,
  mealOptions,
}: {
  token: string;
  guestName: string;
  coupleName: string;
  weddingDate: string;
  venue: string;
  location: string;
  mealOptions: string[];
}) {
  const { language, text } = useLanguage();
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
  const mealPreference = watch("mealPreference") ?? "";

  async function submit(values: RsvpValues) {
    const result = rsvpSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RsvpValues;
        if (field) setError(field, { type: "validate", message: issue.message });
      });
      return;
    }
    try {
      await apiRequest(`/api/v1/invitations/${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: JSON.stringify(result.data),
      });
      setSubmitted(true);
      toast.success(text("Your RSVP has been saved."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Your RSVP could not be saved."));
    }
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
            {coupleName}{" "}
            {text("have received your response. You can return to this invitation at any time.")}
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
        <div className="invite-monogram">{getInitials(coupleName)}</div>
        <div className="invite-date">{formatDate(weddingDate, "DD · MM · YYYY", language)}</div>
        <div className="invite-botanical">✦</div>
      </div>
      <section className="invite-card">
        <Brand />
        <p className="eyebrow">{text("Together with their families")}</p>
        <h1>{coupleName}</h1>
        <p className="invite-lead">{text("joyfully invite you to celebrate their wedding")}</p>
        <div className="invitation-details">
          <div>
            <span>{text("Wedding date")}</span>
            <strong>{text(weddingDate)}</strong>
            <small>{guestName}</small>
          </div>
          <i />
          <div>
            <span>{text(venue)}</span>
            <strong>{text(location)}</strong>
          </div>
        </div>
        <form className="rsvp-form" onSubmit={handleSubmit(submit)} noValidate>
          <h2>
            <FieldLabel required>{text("Will you be joining us?")}</FieldLabel>
          </h2>
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
            <p className="text-center text-sm text-yes-wine">
              {text(errors.response.message ?? "")}
            </p>
          )}
          {response === "yes" && (
            <div className="rsvp-details">
              <label>
                <FieldLabel required>{text("Meal preference")}</FieldLabel>
                <YesSelect
                  ariaLabel={text("Meal preference")}
                  invalid={Boolean(errors.mealPreference)}
                  id="rsvp-meal-preference"
                  name="mealPreference"
                  onChange={(value) => setValue("mealPreference", value, { shouldValidate: true })}
                  options={mealOptions.map((meal) => ({ value: meal, label: text(meal) }))}
                  placeholder={text("Select a meal")}
                  required
                  value={mealPreference}
                />
                {errors.mealPreference && (
                  <small className="text-yes-wine">
                    {text(errors.mealPreference.message ?? "")}
                  </small>
                )}
              </label>
              <label>
                {text("Dietary notes")}
                <textarea
                  {...register("dietaryNotes")}
                  id="rsvp-dietary-notes"
                  name="dietaryNotes"
                  aria-invalid={Boolean(errors.dietaryNotes)}
                  maxLength={500}
                  placeholder={text("Allergies or requirements we should know about")}
                />
                <CharacterCount value={watch("dietaryNotes") ?? ""} max={500} />
                {errors.dietaryNotes && (
                  <small className="text-yes-wine">{text(errors.dietaryNotes.message ?? "")}</small>
                )}
              </label>
            </div>
          )}
          <button disabled={!response} className="button button-primary button-wide" type="submit">
            {text("Send my response →")}
          </button>
        </form>
        <p className="invite-footer">
          {text("You can return to this private invitation to update your response.")}
        </p>
      </section>
    </main>
  );
}
