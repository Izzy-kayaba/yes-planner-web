"use client";

import { getCountries, isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FieldLabel } from "@/components/forms/FieldLabel";

export function ProfileCompletionForm({
  firstName: initialFirstName,
  lastName: initialLastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const { text } = useLanguage();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaultCountry, setDefaultCountry] = useState<Country>("ZA");
  useEffect(() => {
    fetch("/api/v1/currency")
      .then((response) => response.json())
      .then((value: { country?: string | null }) => {
        if (value.country && getCountries().includes(value.country as Country))
          setDefaultCountry(value.country as Country);
      })
      .catch(() => setDefaultCountry("ZA"));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error(text("Enter a valid phone number."));
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, phoneNumber }),
      });
      toast.success(text("Profile saved."));
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Profile could not be saved."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("First name")}</FieldLabel>
          <input
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label>
          <FieldLabel required>{text("Last name")}</FieldLabel>
          <input required value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </label>
      </div>
      <label>
        <FieldLabel required>{text("Phone number")}</FieldLabel>
        <PhoneInput
          className="phone-input"
          defaultCountry={defaultCountry}
          international
          countryCallingCodeEditable={false}
          value={phoneNumber}
          onChange={(value) => setPhoneNumber(value ?? "")}
          required
        />
      </label>
      <p className="form-hint">
        {text("Use a WhatsApp-enabled number so other authorised users can contact you.")}
      </p>
      <Button disabled={saving} fullWidth type="submit">
        {text("Complete profile")}
      </Button>
    </form>
  );
}
