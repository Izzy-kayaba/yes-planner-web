import "dotenv/config";
import { MongoClient } from "mongodb";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  throw new Error(
    "Pass the account email: npm run admin:set -- admin@example.com"
  );
}

const production = process.env.NODE_ENV === "production";

const uri = production
  ? (process.env.MONGODB_PRODUCTION_URI ?? process.env.MONGODB_URI)
  : (process.env.MONGODB_DEVELOPMENT_URI ?? process.env.MONGODB_URI);

const databaseName = production
  ? (process.env.MONGODB_PRODUCTION_DATABASE ?? process.env.MONGODB_DATABASE)
  : (process.env.MONGODB_DEVELOPMENT_DATABASE ?? process.env.MONGODB_DATABASE);

if (!uri || !databaseName) {
  throw new Error("MongoDB URI and database name are required.");
}

const client = new MongoClient(uri);

try {
  const result = await client
    .db(databaseName)
    .collection("user")
    .updateOne(
      { email },
      {
        $set: {
          role: "SystemAdmin",
          updatedAt: new Date(),
        },
      }
    );

  if (!result.matchedCount) {
    throw new Error(`No Better Auth user found for ${email}.`);
  }

  process.stdout.write(
    `SystemAdmin access granted to ${email}.\n`
  );
} finally {
  await client.close();
}