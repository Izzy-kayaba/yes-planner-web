import { MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";

const allowedRoles = new Set([
  "SuperAdmin",
  "PlatformAdmin",
  "Support",
  "Verification",
  "Operations",
  "Finance",
]);
const { environment, positional } = parseScriptArguments(process.argv.slice(2));
const [action, role, rawEmail] = positional;
const email = rawEmail?.trim().toLowerCase();

if (
  positional.length !== 3 ||
  !["grant", "revoke"].includes(action) ||
  !allowedRoles.has(role) ||
  !email
) {
  throw new Error(
    "Usage: npm run admin:role -- <grant|revoke> <SuperAdmin|PlatformAdmin|Support|Verification|Operations|Finance> <email> --env <development|production>",
  );
}

const { uri, databaseName } = databaseEnvironment(environment);
process.stdout.write(`Target environment: ${environment} (${databaseName})\n`);

const client = new MongoClient(uri);
try {
  const users = client.db(databaseName).collection("user");
  const user = await users.findOne({ email }, { projection: { accountType: 1, role: 1 } });
  if (!user) throw new Error(`No Better Auth user found for ${email}.`);

  if (action === "revoke" && role === "SuperAdmin") {
    const activeAdmins = await users.countDocuments({
      $or: [{ platformRoles: "SuperAdmin" }, { role: "SystemAdmin" }],
    });
    if (activeAdmins <= 1) throw new Error("The last Super Admin cannot be removed.");
  }

  const update =
    action === "grant"
      ? {
          $addToSet: { platformRoles: role },
          ...(role === "SuperAdmin" ? { $set: { role: "SystemAdmin" } } : {}),
        }
      : {
          $pull: { platformRoles: role },
          ...(role === "SuperAdmin"
            ? {
                $set: {
                  role: typeof user.accountType === "string" ? user.accountType : "Couple",
                },
              }
            : {}),
        };

  await users.updateOne({ email }, { ...update, $currentDate: { updatedAt: true } });
  process.stdout.write(
    `${role} access ${action === "grant" ? "granted to" : "revoked from"} ${email}.\n`,
  );
} finally {
  await client.close();
}
