import { MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";

const { environment, positional } = parseScriptArguments(process.argv.slice(2));
const { uri, databaseName: database } = databaseEnvironment(environment);
const apply = positional.includes("--apply");

const client = new MongoClient(uri);
await client.connect();
const db = client.db(database);
try {
  const operations = [
    ["user", { currency: { $exists: false } }, { $set: { currency: "USD" } }],
    [
      "weddingProfiles",
      { budgetCurrency: { $exists: false } },
      { $set: { budgetCurrency: "USD" } },
    ],
    ["vendorProfiles", { priceCurrency: { $exists: false } }, { $set: { priceCurrency: "USD" } }],
    [
      "workspaceItems",
      {
        module: { $in: ["budget", "vendors", "bookings", "payments"] },
        currency: { $exists: false },
      },
      { $set: { currency: "USD" } },
    ],
  ];
  for (const [collectionName, filter, update] of operations) {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments(filter);
    console.log(
      `${environment}: ${collectionName}: ${count} records ${apply ? "will be updated" : "would be updated"}.`,
    );
    if (apply && count) await collection.updateMany(filter, update);
  }
} finally {
  await client.close();
}
