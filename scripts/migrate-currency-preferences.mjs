import { MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";

const { environment, positional } = parseScriptArguments(process.argv.slice(2));
const apply = positional.includes("--apply");
const { uri, databaseName } = databaseEnvironment(environment);
const client = new MongoClient(uri);

await client.connect();
const db = client.db(databaseName);

try {
  const users = db.collection("user");
  const lockedCurrencyFilter = {
    currency: { $in: ["USD", "ZAR"] },
    currencyPreferenceSet: { $ne: true },
  };
  const missingCurrencyFilter = {
    $or: [{ currency: { $exists: false } }, { currency: { $nin: ["USD", "ZAR"] } }],
  };
  const lockableCount = await users.countDocuments(lockedCurrencyFilter);
  const missingCurrencyCount = await users.countDocuments(missingCurrencyFilter);
  const byCurrency = await users
    .aggregate([
      { $match: lockedCurrencyFilter },
      { $group: { _id: "$currency", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  console.log(
    `${environment}: ${lockableCount} user preferences ${apply ? "will be locked" : "would be locked"}.`,
  );
  console.log(`${environment}: currency distribution ${JSON.stringify(byCurrency)}.`);
  console.log(
    `${environment}: ${missingCurrencyCount} users have no valid currency and require onboarding confirmation.`,
  );
  console.log(`${environment}: stored monetary amounts will not be changed.`);

  if (apply && lockableCount > 0) {
    const result = await users.updateMany(lockedCurrencyFilter, {
      $set: { currencyPreferenceSet: true, updatedAt: new Date() },
    });
    console.log(`${environment}: locked ${result.modifiedCount} user preferences.`);
  }
} finally {
  await client.close();
}
