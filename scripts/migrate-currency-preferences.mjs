import "dotenv/config";
import { MongoClient } from "mongodb";

const args = new Set(process.argv.slice(2));
const environment = process.argv[process.argv.indexOf("--env") + 1] || "development";
const apply = args.has("--apply");
const uri =
  environment === "production"
    ? process.env.MONGODB_PRODUCTION_URI
    : process.env.MONGODB_DEVELOPMENT_URI;
const database =
  environment === "production"
    ? process.env.MONGODB_PRODUCTION_DATABASE
    : process.env.MONGODB_DEVELOPMENT_DATABASE;

if (!uri || !database) throw new Error(`Missing MongoDB settings for ${environment}.`);
if (environment === "production" && !apply) {
  throw new Error("Production migration is dry-run only unless --apply is supplied.");
}

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
