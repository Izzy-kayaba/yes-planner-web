import { MongoClient } from "mongodb";
import { databaseEnvironment } from "./environment.mjs";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  throw new Error("Pass the account email: npm run admin:set -- admin@example.com");
}

const { uri, databaseName } = databaseEnvironment();

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
      },
    );

  if (!result.matchedCount) {
    throw new Error(`No Better Auth user found for ${email}.`);
  }

  process.stdout.write(`SystemAdmin access granted to ${email}.\n`);
} finally {
  await client.close();
}
