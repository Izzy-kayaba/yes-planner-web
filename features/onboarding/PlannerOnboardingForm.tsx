"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api/client";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { FieldLabel } from "@/components/forms/FieldLabel";

export type PlannerOnboardingValue = {
  organisationName: string;
  contactName: string;
  bio: string;
  serviceArea: string;
  teamSize: number;
  yearsExperience: number;
  website: string;
};

export function PlannerOnboardingForm({ initialValue }: { initialValue: PlannerOnboardingValue }) {
  const router = useRouter();
  const { text } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  function update<K extends keyof PlannerOnboardingValue>(
    field: K,
    next: PlannerOnboardingValue[K],
  ) {
    setValue((current) => ({ ...current, [field]: next }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/v1/planner-profile", { method: "PUT", body: JSON.stringify(value) });
      toast.success(text("Planner profile saved."));
      router.push("/planner");
      router.refresh();
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Planner profile could not be saved."),
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
          <h2>{text("Planning organisation")}</h2>
          <p>{text("Set up the details clients and team members will use.")}</p>
        </div>
      </div>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("Organisation name")}</FieldLabel>
          <input
            id="planner-organisation-name"
            name="organisationName"
            required
            value={value.organisationName}
            onChange={(event) => update("organisationName", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel required>{text("Contact name")}</FieldLabel>
          <input
            id="planner-contact-name"
            name="contactName"
            required
            value={value.contactName}
            onChange={(event) => update("contactName", event.target.value)}
          />
        </label>
      </div>
      <label>
        <FieldLabel required>{text("Organisation description")}</FieldLabel>
        <textarea
          id="planner-description"
          maxLength={2000}
          minLength={30}
          name="bio"
          required
          rows={5}
          value={value.bio}
          onChange={(event) => update("bio", event.target.value)}
        />
        <CharacterCount value={value.bio} min={30} max={2000} />
      </label>
      <label>
        <FieldLabel required>{text("Service area")}</FieldLabel>
        <input
          id="planner-service-area"
          name="serviceArea"
          required
          value={value.serviceArea}
          onChange={(event) => update("serviceArea", event.target.value)}
        />
      </label>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("Team size")}</FieldLabel>
          <input
            id="planner-team-size"
            min="1"
            name="teamSize"
            required
            type="number"
            value={value.teamSize || ""}
            onChange={(event) => update("teamSize", Number(event.target.value))}
          />
        </label>
        <label>
          <FieldLabel required>{text("Years of experience")}</FieldLabel>
          <input
            id="planner-years-experience"
            min="0"
            name="yearsExperience"
            required
            type="number"
            value={value.yearsExperience}
            onChange={(event) => update("yearsExperience", Number(event.target.value))}
          />
        </label>
      </div>
      <label>
        {text("Website")}
        <input
          id="planner-website"
          name="website"
          type="url"
          placeholder="https://"
          value={value.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </label>
      <div className="settings-actions">
        <Button disabled={saving} type="submit">
          {saving ? text("Saving…") : text("Save and continue")}
        </Button>
      </div>
    </form>
  );
}
