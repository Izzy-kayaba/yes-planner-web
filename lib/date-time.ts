import moment from "moment";
import "moment/locale/fr";

export type DateLanguage = "en" | "fr";

function localized(value: moment.MomentInput, language: DateLanguage) {
  return moment(value).locale(language === "fr" ? "fr" : "en");
}

export function formatDate(value: moment.MomentInput, format: string, language: DateLanguage) {
  return localized(value, language).format(format);
}

export function formatDateTime(
  date: string,
  time: string,
  language: DateLanguage,
  format = "D MMM YYYY [at] HH:mm",
) {
  return localized(`${date}T${time}`, language).format(format);
}

export function daysUntil(value: moment.MomentInput) {
  return Math.max(0, localized(value, "en").startOf("day").diff(moment().startOf("day"), "days"));
}

export function greetingForNow(language: DateLanguage) {
  const hour = moment().hour();
  if (language === "fr") return hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
