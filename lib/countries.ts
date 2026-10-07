import { getCountries } from "libphonenumber-js";

export function countryOptions(locale: string) {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return getCountries()
    .map((code) => ({ value: code, label: names.of(code) ?? code }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}
