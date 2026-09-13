import "server-only";

import { getTranslations } from "next-intl/server";
import { getLiteralMessageKey } from "@/lib/i18n-literals";

/** Resolves existing interface copy through next-intl in Server Components. */
export async function getTextTranslator() {
  const translate = await getTranslations();

  return (content: string) => {
    const key = getLiteralMessageKey(content);
    return key ? translate(key) : content;
  };
}
