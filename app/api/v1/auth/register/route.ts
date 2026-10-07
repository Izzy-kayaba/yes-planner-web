import { auth } from "@/lib/auth";
import { createRegistrationHandler } from "@/lib/auth/register-handler";
import { isSelfServiceRole } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const users = mongoDb.collection("user");

// Keep registration checks shared so account creation applies the same role and phone rules.
export const POST = createRegistrationHandler({
  ensureIndexes: ensureMongoIndexes,
  isAllowedRole: isSelfServiceRole,
  findUser: (query) => users.findOne(query, { projection: { _id: 1 } }),
  signUp: ({ email, password, name, headers }) =>
    auth.api.signUpEmail({ body: { email, password, name }, headers, asResponse: true }),
  updateUser: async (email, details) => {
    await users.updateOne({ email }, { $set: { ...details, updatedAt: new Date() } });
  },
  reportError: (error) => {
    console.error("Registration failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown registration error",
    });
  },
});
