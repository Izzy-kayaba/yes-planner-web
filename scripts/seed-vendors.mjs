import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

function readEnvironment(fileName) {
  const values = {};

  for (const line of fs.readFileSync(fileName, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

const projectRoot = process.cwd();
const envFile = process.argv[2] ?? ".env.local";
const dataFile = process.argv[3] ?? "data.json";
const environment = readEnvironment(path.resolve(projectRoot, envFile));
const productionEnvironment = /(?:^|\.)prod(?:uction)?(?:\.|$)/i.test(path.basename(envFile));
const uri = productionEnvironment
  ? environment.MONGODB_PRODUCTION_URI
  : environment.MONGODB_DEVELOPMENT_URI;
const databaseName = productionEnvironment
  ? environment.MONGODB_PRODUCTION_DATABASE
  : environment.MONGODB_DEVELOPMENT_DATABASE;

if (!uri || !databaseName) {
  const prefix = productionEnvironment ? "MONGODB_PRODUCTION" : "MONGODB_DEVELOPMENT";
  throw new Error(`${envFile} must define ${prefix}_URI and ${prefix}_DATABASE.`);
}

const vendors = JSON.parse(fs.readFileSync(path.resolve(projectRoot, dataFile), "utf8"));
if (!Array.isArray(vendors) || vendors.length === 0) {
  throw new Error(`${dataFile} must contain a non-empty array of vendor profiles.`);
}

const now = new Date();
const operations = vendors.map((vendor) => {
  if (!vendor?.businessName || typeof vendor.businessName !== "string") {
    throw new Error("Every vendor must have a businessName.");
  }

  const sourceUrl = vendor.source?.url;
  const filter = sourceUrl
    ? { seeded: true, "source.url": sourceUrl }
    : { seeded: true, businessName: vendor.businessName };

  return {
    updateOne: {
      filter,
      update: {
        $set: { ...vendor, seeded: true, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  };
});

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });

try {
  await client.connect();
  const database = client.db(databaseName);
  const collection = database.collection("vendorProfiles");
  const collectionExists = await database
    .listCollections({ name: "vendorProfiles" }, { nameOnly: true })
    .hasNext();
  const ownerIndex = collectionExists
    ? (await collection.indexes()).find((index) => index.name === "vendor_profile_owner")
    : undefined;

  if (ownerIndex && !ownerIndex.partialFilterExpression) {
    await collection.dropIndex("vendor_profile_owner");
  }

  if (!ownerIndex?.partialFilterExpression) {
    await collection.createIndex(
      { ownerUserId: 1 },
      {
        name: "vendor_profile_owner",
        unique: true,
        partialFilterExpression: { ownerUserId: { $type: "string" } },
      },
    );
  }

  const result = await collection.bulkWrite(operations, { ordered: false });
  const seededCount = await collection.countDocuments({ seeded: true });

  console.log(`Database: ${databaseName}`);
  console.log(`Input profiles: ${vendors.length}`);
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Updated: ${result.modifiedCount}`);
  console.log(`Matched without changes: ${result.matchedCount - result.modifiedCount}`);
  console.log(`Total seeded profiles: ${seededCount}`);
} finally {
  await client.close();
}
