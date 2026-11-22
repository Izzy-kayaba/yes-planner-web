import type { SupportedCurrency } from "@/lib/currency";
import { mongoDb } from "@/lib/mongodb";

export async function lockCurrencyPreference(email: string, currency: SupportedCurrency) {
  const users = mongoDb.collection("user");
  const current = await users.findOne(
    { email },
    { projection: { currency: 1, currencyPreferenceSet: 1 } },
  );
  if (!current) throw new Error("User not found.");

  if (current.currencyPreferenceSet === true) {
    if (current.currency !== currency)
      throw new Error("Currency is already locked for this account.");
    return;
  }

  await users.updateOne(
    { email, currencyPreferenceSet: { $ne: true } },
    { $set: { currency, currencyPreferenceSet: true, updatedAt: new Date() } },
  );
  const saved = await users.findOne(
    { email },
    { projection: { currency: 1, currencyPreferenceSet: 1 } },
  );
  if (saved?.currency !== currency || saved.currencyPreferenceSet !== true) {
    throw new Error("Currency could not be saved.");
  }
}
