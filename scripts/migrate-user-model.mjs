import "dotenv/config";
import { MongoClient } from "mongodb";

const production = process.env.NODE_ENV === "production";
const uri = production ? process.env.MONGODB_PRODUCTION_URI : process.env.MONGODB_DEVELOPMENT_URI;
const databaseName = production
  ? process.env.MONGODB_PRODUCTION_DATABASE
  : process.env.MONGODB_DEVELOPMENT_DATABASE;

if (!uri || !databaseName) throw new Error("MongoDB URI and database name are required.");

const client = new MongoClient(uri);

try {
  await client.connect();
  const database = client.db(databaseName);
  const users = database.collection("user");
  const plannerProfiles = database.collection("plannerProfiles");
  const vendorProfiles = database.collection("vendorProfiles");

  await users.updateMany(
    { role: "Planner" },
    { $set: { role: "Vendor", accountType: "Vendor", updatedAt: new Date() } },
  );
  for (const accountType of ["Couple", "Venue", "Vendor", "Guest"]) {
    await users.updateMany(
      { role: accountType, accountType: { $exists: false } },
      { $set: { accountType, updatedAt: new Date() } },
    );
  }

  for await (const planner of plannerProfiles.find({})) {
    await vendorProfiles.updateOne(
      { ownerUserId: planner.ownerUserId },
      {
        $set: {
          businessName: planner.organisationName,
          contactName: planner.contactName,
          bio: planner.bio,
          serviceArea: planner.serviceArea,
          website: planner.website ?? "",
          published: true,
          updatedAt: new Date(),
        },
        $addToSet: { services: "Wedding planning" },
        $setOnInsert: {
          ownerUserId: planner.ownerUserId,
          startingPriceMinor: 0,
          startingPriceRangeKey: "under-500",
          instagramHandle: "",
          profileImage: "",
          portfolioImages: [],
          createdAt: planner.createdAt ?? new Date(),
        },
      },
      { upsert: true },
    );
  }

  await database.collection("weddingCollaborators").updateMany(
    { role: "Planner" },
    {
      $set: { role: "Vendor", access: "FullManager", updatedAt: new Date() },
      $addToSet: { services: "Wedding planning" },
    },
  );
  await database
    .collection("weddingCollaborators")
    .updateMany(
      { role: "Vendor", access: { $exists: false } },
      { $set: { access: "Vendor", updatedAt: new Date() } },
    );

  process.stdout.write(`User model migration completed for ${databaseName}.\n`);
} finally {
  await client.close();
}
