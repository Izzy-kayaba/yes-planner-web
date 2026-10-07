"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { apiRequest } from "@/lib/api/client";
import moment from "moment";
import { YesSelect } from "@/components/ui/YesSelect";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { countryOptions } from "@/lib/countries";
import {
  budgetRanges,
  guestRanges,
  guestRangeValue,
  inferGuestRange,
  inferMoneyRange,
  moneyRangeValue,
} from "@/lib/estimate-ranges";

export type WeddingOnboardingValue = {
  firstName: string;
  lastName: string;
  partnerName: string;
  displayName: string;
  weddingDate: string;
  venue: string;
  location: string;
  budgetMinor: number;
  budgetRangeKey?: string;
  estimatedGuests: number;
  guestRangeKey?: string;
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

export function WeddingOnboardingForm({
  initialValue,
  venueOptions = [],
}: {
  initialValue?: WeddingOnboardingValue;
  venueOptions?: string[];
}) {
  const router = useRouter();
  const { language, text } = useLanguage();
  const { currency, displayMoney } = useCurrency();
  const [value, setValue] = useState(initialValue ?? emptyValue);
  const [saving, setSaving] = useState(false);
  const [displayNameEdited, setDisplayNameEdited] = useState(Boolean(initialValue?.displayName));

  useEffect(() => {
    const displayName = [value.firstName.trim(), value.partnerName.trim()]
      .filter(Boolean)
      .join(" & ")
      .slice(0, 100);
    if (!displayNameEdited && value.displayName !== displayName) {
      setValue((current) => ({ ...current, displayName }));
    }
  }, [displayNameEdited, value.displayName, value.firstName, value.partnerName]);

  function update<K extends keyof WeddingOnboardingValue>(
    field: K,
    nextValue: WeddingOnboardingValue[K],
  ) {
    setValue((current) => ({ ...current, [field]: nextValue }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budgetRangeKey =
      value.budgetRangeKey ||
      inferMoneyRange(budgetRanges, value.budgetMinor) ||
      budgetRanges[0].id;
    const guestRangeKey =
      value.guestRangeKey || inferGuestRange(value.estimatedGuests) || guestRanges[0].id;
    const budgetRange = budgetRanges.find((range) => range.id === budgetRangeKey)!;
    const guestRange = guestRanges.find((range) => range.id === guestRangeKey)!;
    setSaving(true);
    try {
      await apiRequest("/api/v1/wedding-profile", {
        method: "PUT",
        body: JSON.stringify({
          ...value,
          budgetMinor: moneyRangeValue(budgetRange),
          budgetRangeKey,
          estimatedGuests: guestRangeValue(guestRange),
          guestRangeKey,
        }),
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
          <FieldLabel required>{text("Your first name")}</FieldLabel>
          <input
            id="wedding-first-name"
            name="firstName"
            autoComplete="given-name"
            onChange={(event) => update("firstName", event.target.value)}
            required
            value={value.firstName}
          />
        </label>
        <label>
          <FieldLabel required>{text("Your last name")}</FieldLabel>
          <input
            id="wedding-last-name"
            name="lastName"
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
          <FieldLabel required>{text("Partner's name")}</FieldLabel>
          <input
            id="wedding-partner-name"
            name="partnerName"
            onChange={(event) => update("partnerName", event.target.value)}
            required
            value={value.partnerName}
          />
        </label>
        <label>
          <FieldLabel required>{text("Couple display name")}</FieldLabel>
          <input
            id="wedding-display-name"
            maxLength={100}
            name="displayName"
            onChange={(event) => {
              setDisplayNameEdited(true);
              update("displayName", event.target.value);
            }}
            required
            value={value.displayName}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          <FieldLabel required>
            {text("Estimated wedding budget")} ({currency})
          </FieldLabel>
          <YesSelect
            ariaLabel={text("Estimated wedding budget")}
            id="wedding-budget-range"
            name="budgetRangeKey"
            onChange={(rangeKey) => {
              const range = budgetRanges.find((item) => item.id === rangeKey)!;
              setValue((current) => ({
                ...current,
                budgetRangeKey: rangeKey,
                budgetMinor: moneyRangeValue(range),
              }));
            }}
            options={budgetRanges.map((range) => ({
              value: range.id,
              label:
                range.maxMinor === null
                  ? `${displayMoney(range.minMinor)}+`
                  : `${displayMoney(range.minMinor)} – ${displayMoney(range.maxMinor)}`,
            }))}
            placeholder={text("Select a budget range")}
            required
            value={value.budgetRangeKey || inferMoneyRange(budgetRanges, value.budgetMinor)}
          />
        </label>
        <label>
          <FieldLabel required>{text("Estimated guests")}</FieldLabel>
          <YesSelect
            ariaLabel={text("Estimated guests")}
            id="wedding-guest-range"
            name="guestRangeKey"
            onChange={(rangeKey) => {
              const range = guestRanges.find((item) => item.id === rangeKey)!;
              setValue((current) => ({
                ...current,
                guestRangeKey: rangeKey,
                estimatedGuests: guestRangeValue(range),
              }));
            }}
            options={guestRanges.map((range) => ({
              value: range.id,
              label: range.max === null ? `${range.min}+` : `${range.min} – ${range.max}`,
            }))}
            placeholder={text("Select a guest range")}
            required
            value={
              value.guestRangeKey || inferGuestRange(value.estimatedGuests) || guestRanges[0].id
            }
          />
        </label>
      </div>
      <label>
        {text("Wedding style")}
        <YesSelect
          ariaLabel={text("Wedding style")}
          id="wedding-style"
          name="weddingStyle"
          onChange={(nextValue) => update("weddingStyle", nextValue)}
          options={[
            "Classic",
            "Modern",
            "Romantic",
            "Minimal",
            "Traditional",
            "Destination",
            "Other",
          ].map((item) => ({ value: item, label: text(item) }))}
          placeholder={text("Select a style")}
          value={value.weddingStyle}
        />
      </label>
      <label>
        {text("Planning notes")}
        <textarea
          id="wedding-planning-notes"
          maxLength={2000}
          name="planningNotes"
          onChange={(event) => update("planningNotes", event.target.value)}
          placeholder={text(
            "Accessibility, cultural traditions, priorities or anything your team should know",
          )}
          rows={4}
          value={value.planningNotes}
        />
        <CharacterCount value={value.planningNotes} max={2000} />
      </label>
      <label>
        <FieldLabel required>{text("Wedding date")}</FieldLabel>
        <input
          id="wedding-date"
          min={moment().format("YYYY-MM-DD")}
          name="weddingDate"
          onChange={(event) => update("weddingDate", event.target.value)}
          required
          type="date"
          value={value.weddingDate}
        />
      </label>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("Wedding venue")}</FieldLabel>
          <input
            id="wedding-venue"
            list="wedding-venue-options"
            name="venue"
            onChange={(event) => update("venue", event.target.value)}
            placeholder={text("Choose a venue or type another name")}
            required
            value={value.venue}
          />
          <datalist id="wedding-venue-options">
            {venueOptions.map((venue) => (
              <option key={venue} value={venue} />
            ))}
          </datalist>
        </label>
        <label>
          <FieldLabel required>{text("Wedding location")}</FieldLabel>
          <YesSelect
            ariaLabel={text("Wedding location")}
            id="wedding-location"
            name="location"
            onChange={(country) => update("location", country)}
            options={countryOptions(language)}
            placeholder={text("Select a country")}
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
