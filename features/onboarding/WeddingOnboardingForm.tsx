"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { apiRequest } from "@/lib/api/client";
import moment from "moment";

export type WeddingOnboardingValue = {
  firstName: string;
  lastName: string;
  partnerName: string;
  displayName: string;
  weddingDate: string;
  venue: string;
  location: string;
  budgetMinor: number;
  estimatedGuests: number;
  weddingStyle: string;
  planningNotes: string;
  phoneNumber?: string;
};

const emptyValue: WeddingOnboardingValue = {
  firstName: "",
  lastName: "",
  partnerName: "",
  displayName: "",
  weddingDate: "",
  venue: "",
  location: "",
  budgetMinor: 0,
  estimatedGuests: 0,
  weddingStyle: "",
  planningNotes: "",
};

export function WeddingOnboardingForm({ initialValue }: { initialValue?: WeddingOnboardingValue }) {
  const router = useRouter();
  const { text } = useLanguage();
  const [value, setValue] = useState(initialValue ?? emptyValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!value.displayName && value.firstName && value.partnerName) {
      setValue((current) => ({
        ...current,
        displayName: `${current.firstName} & ${current.partnerName}`,
      }));
    }
  }, [value.displayName, value.firstName, value.partnerName]);

  function update<K extends keyof WeddingOnboardingValue>(
    field: K,
    nextValue: WeddingOnboardingValue[K],
  ) {
    setValue((current) => ({ ...current, [field]: nextValue }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/v1/wedding-profile", {
        method: "PUT",
        body: JSON.stringify(value),
      });
      toast.success(text("Wedding details saved."));
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : text("Wedding details could not be saved."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel onboarding-form grid gap-6" onSubmit={save}>
      <div className="onboarding-section-heading">
        <span>1</span>
        <div>
          <h2>{text("About you")}</h2>
          <p>{text("Tell us who is planning this celebration.")}</p>
        </div>
      </div>
      <div className="form-row">
        <label>
          {text("Your first name")}
          <input
            autoComplete="given-name"
            onChange={(event) => update("firstName", event.target.value)}
            required
            value={value.firstName}
          />
        </label>
        <label>
          {text("Your last name")}
          <input
            autoComplete="family-name"
            onChange={(event) => update("lastName", event.target.value)}
            required
            value={value.lastName}
          />
        </label>
      </div>
      <div className="onboarding-section-heading">
        <span>2</span>
        <div>
          <h2>{text("Celebration details")}</h2>
          <p>{text("These details personalise dates, budgets and recommendations.")}</p>
        </div>
      </div>
      <div className="form-row">
        <label>
          {text("Partner's name")}
          <input
            onChange={(event) => update("partnerName", event.target.value)}
            required
            value={value.partnerName}
          />
        </label>
        <label>
          {text("Couple display name")}
          <input
            onChange={(event) => update("displayName", event.target.value)}
            required
            value={value.displayName}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          {text("Estimated wedding budget")} (USD)
          <span className="input-with-prefix">
            <b>$</b>
            <input
              min="1"
              onChange={(event) =>
                update("budgetMinor", Math.round(Number(event.target.value) * 100))
              }
              required
              type="number"
              value={value.budgetMinor ? value.budgetMinor / 100 : ""}
            />
          </span>
        </label>
        <label>
          {text("Estimated guest count")}
          <input
            min="1"
            onChange={(event) => update("estimatedGuests", Number(event.target.value))}
            required
            type="number"
            value={value.estimatedGuests || ""}
          />
        </label>
      </div>
      <label>
        {text("Wedding style")}
        <select
          onChange={(event) => update("weddingStyle", event.target.value)}
          value={value.weddingStyle}
        >
          <option value="">{text("Select a style")}</option>
          <option value="Classic">{text("Classic")}</option>
          <option value="Modern">{text("Modern")}</option>
          <option value="Romantic">{text("Romantic")}</option>
          <option value="Minimal">{text("Minimal")}</option>
          <option value="Traditional">{text("Traditional")}</option>
          <option value="Destination">{text("Destination")}</option>
          <option value="Other">{text("Other")}</option>
        </select>
      </label>
      <label>
        {text("Planning notes")}
        <textarea
          onChange={(event) => update("planningNotes", event.target.value)}
          placeholder={text(
            "Accessibility, cultural traditions, priorities or anything your team should know",
          )}
          rows={4}
          value={value.planningNotes}
        />
      </label>
      <label>
        {text("Wedding date")}
        <input
          min={moment().format("YYYY-MM-DD")}
          onChange={(event) => update("weddingDate", event.target.value)}
          required
          type="date"
          value={value.weddingDate}
        />
      </label>
      <div className="form-row">
        <label>
          {text("Wedding venue")}
          <input
            onChange={(event) => update("venue", event.target.value)}
            required
            value={value.venue}
          />
        </label>
        <label>
          {text("Wedding location")}
          <input
            onChange={(event) => update("location", event.target.value)}
            placeholder={text("City or area")}
            required
            value={value.location}
          />
        </label>
      </div>
      <div className="settings-actions">
        <Button disabled={saving} type="submit">
          {saving ? text("Saving…") : text("Save and continue")}
        </Button>
      </div>
    </form>
  );
}
