// Purpose: implements scripts/seed-vendors.mjs for the Yes Planner web application.
import fs from "node:fs";
import path from "node:path";
import { GridFSBucket, MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";
import { downloadLogo, normalizeLogoSourceUrl } from "./vendor-logo.mjs";

const projectRoot = process.cwd();
const { environment, positional } = parseScriptArguments(process.argv.slice(2));
if (positional.length > 1) throw new Error("Pass at most one vendor data-file path.");
const dataFile = positional[0] ?? "data.json";
const countryFileCode = path.basename(dataFile).match(/^([a-z]{2})-data\.json$/i)?.[1]?.toUpperCase();
const { uri, databaseName } = databaseEnvironment(environment);
process.stdout.write(`Target environment: ${environment} (${databaseName})\n`);

const vendors = JSON.parse(fs.readFileSync(path.resolve(projectRoot, dataFile), "utf8"));
if (!Array.isArray(vendors) || vendors.length === 0) {
  throw new Error(`${dataFile} must contain a non-empty array of vendor profiles.`);
}

const now = new Date();

// Compare only seed-owned values so account-owned fields are not overwritten or counted as changes.
function valuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== typeof right) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => valuesEqual(value, right[index]))
    );
  }
  if (typeof left === "object") {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key) => Object.hasOwn(right, key) && valuesEqual(left[key], right[key]))
    );
  }
  return false;
}

function changedFields(existing, next) {
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => !valuesEqual(existing?.[key], value)),
  );
}

for (const vendor of vendors) {
  if (!vendor?.businessName || typeof vendor.businessName !== "string") {
    throw new Error("Every vendor must have a businessName.");
  }
  if (!/^[A-Z]{2}$/.test(vendor.countryCode ?? "")) {
    throw new Error(
      `Every vendor must have a two-letter uppercase countryCode: ${vendor.businessName}.`,
    );
  }
  const expectedCountryCode = countryFileCode;
  if (expectedCountryCode && vendor.countryCode !== expectedCountryCode) {
    throw new Error(
      `${dataFile} must contain only ${expectedCountryCode} profiles; ${vendor.businessName} has ${vendor.countryCode}.`,
    );
  }
  normalizeLogoSourceUrl(vendor.logoSourceUrl);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });

async function storeSeededLogo(database, vendor, sourceUrl) {
  const logo = await downloadLogo(sourceUrl);
  if (!logo) return null;
  const bucket = new GridFSBucket(database, { bucketName: "vendorMedia" });
  const safeName = vendor.businessName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
  const upload = bucket.openUploadStream(`${safeName}-logo`, {
    contentType: logo.contentType,
    metadata: {
      ownerUserId: null,
      visibility: "public-vendor-profile",
      sourceType: "official-business-logo",
      sourceUrl: logo.sourceUrl,
      businessName: vendor.businessName,
      uploadedAt: new Date(),
    },
  });
  await new Promise((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", resolve);
    upload.end(logo.buffer);
  });
  return `/api/v1/media/${upload.id.toString()}`;
}

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

  const seededOperations = [];
  let matchedWithoutChanges = 0;
  let plannedUpdates = 0;
  for (const vendor of vendors) {
    const sourceUrl = normalizeLogoSourceUrl(vendor.logoSourceUrl);
    const filter = vendor.source?.url
      ? { seeded: true, "source.url": vendor.source.url }
      : { seeded: true, businessName: vendor.businessName };
    const existing = await collection.findOne(filter);
    const seededVendor = { ...vendor, seeded: true };
    if (sourceUrl) {
      if (existing?.profileImage && existing.logoSourceUrl === sourceUrl) {
        seededVendor.profileImage = existing.profileImage;
      } else {
        seededVendor.profileImage = await storeSeededLogo(database, vendor, sourceUrl);
      }
      seededVendor.logoSourceUrl = sourceUrl;
    }
    const updates = changedFields(existing, seededVendor);
    if (!existing) {
      seededOperations.push({
        updateOne: {
          filter,
          update: { $set: seededVendor, $setOnInsert: { createdAt: now } },
          upsert: true,
        },
      });
    } else if (Object.keys(updates).length > 0) {
      plannedUpdates += 1;
      seededOperations.push({
        updateOne: {
          filter,
          update: { $set: { ...updates, updatedAt: now } },
          upsert: false,
        },
      });
    } else {
      matchedWithoutChanges += 1;
    }
  }
  const result = seededOperations.length
    ? await collection.bulkWrite(seededOperations, { ordered: false })
    : { upsertedCount: 0, modifiedCount: 0 };
  const seededCount = await collection.countDocuments({ seeded: true });

  console.log(`Database: ${databaseName}`);
  console.log(`Input profiles: ${vendors.length}`);
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Updated: ${Math.min(result.modifiedCount, plannedUpdates)}`);
  console.log(`Matched without changes: ${matchedWithoutChanges}`);
  console.log(`Total seeded profiles: ${seededCount}`);
} finally {
  await client.close();
}
