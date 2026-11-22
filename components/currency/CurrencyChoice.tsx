"use client";

import { Coins } from "lucide-react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { YesSelect } from "@/components/ui/YesSelect";
import { currencyLabel, type SupportedCurrency } from "@/lib/currency";

export function CurrencyChoice({
  value,
  onChange,
  text,
}: {
  value: SupportedCurrency;
  onChange: (value: SupportedCurrency) => void;
  text: (value: string) => string;
}) {
  return (
    <label>
      <FieldLabel required>{text("Currency for this account")}</FieldLabel>
      <YesSelect
        ariaLabel={text("Currency for this account")}
        id="onboarding-currency"
        leadingIcon={<Coins size={15} aria-hidden="true" />}
        name="currency"
        onChange={(next) => onChange(next as SupportedCurrency)}
        options={[
          { value: "ZAR", label: text(currencyLabel("ZAR")) },
          { value: "USD", label: text(currencyLabel("USD")) },
        ]}
        value={value}
      />
      <small className="form-hint">
        {text("Choose your currency once. It cannot be changed later from the app.")}
      </small>
    </label>
  );
}
