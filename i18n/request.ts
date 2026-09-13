import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { intlMessages, isSupportedLanguage, languageCookieName, type Language } from "@/lib/i18n";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLanguage =
    cookieStore.get(languageCookieName)?.value ?? cookieStore.get("vow-language")?.value;
  const locale: Language = isSupportedLanguage(cookieLanguage) ? cookieLanguage : "en";

  return {
    locale,
    messages: intlMessages[locale],
    timeZone: "Africa/Johannesburg",
  };
});
