import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { databaseEnvironment, loadProjectEnvironment } from "./environment.mjs";

const projectRoot = process.cwd();
loadProjectEnvironment();
const dataFile = process.argv[2] ?? "data.json";
const { uri, databaseName } = databaseEnvironment();

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
