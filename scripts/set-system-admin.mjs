import { MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";

const { environment, positional } = parseScriptArguments(process.argv.slice(2));
const email = positional[0]?.trim().toLowerCase();

if (!email || positional.length > 1) {
  throw new Error(
    "Pass one account email and select an environment: npm run admin:set -- admin@example.com --env development",
  );
}

const { uri, databaseName } = databaseEnvironment(environment);
process.stdout.write(`Target environment: ${environment} (${databaseName})\n`);

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
