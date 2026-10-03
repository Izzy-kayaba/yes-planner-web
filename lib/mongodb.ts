import "server-only";

import { MongoClient, type Db } from "mongodb";

function databaseConfiguration() {
  const production = process.env.NODE_ENV === "production";
  const productionRuntime = production && process.env.NEXT_PHASE !== "phase-production-build";
  const uri = production ? process.env.MONGODB_PRODUCTION_URI : process.env.MONGODB_DEVELOPMENT_URI;
  const databaseName = production
    ? process.env.MONGODB_PRODUCTION_DATABASE
    : process.env.MONGODB_DEVELOPMENT_DATABASE;

  if (productionRuntime && (!uri || !databaseName)) {
    throw new Error(
      "MONGODB_PRODUCTION_URI and MONGODB_PRODUCTION_DATABASE are required in production.",
    );
  }

  return {
    uri: uri ?? "mongodb://127.0.0.1:27017",
    databaseName: databaseName ?? (production ? "yes_planner" : "yes_planner_development"),
  };
}

const configuration = databaseConfiguration();

declare global {
  // eslint-disable-next-line no-var
  var yesPlannerMongoClient: MongoClient | undefined;
}

export const mongoClient = global.yesPlannerMongoClient ?? new MongoClient(configuration.uri);

if (process.env.NODE_ENV !== "production") global.yesPlannerMongoClient = mongoClient;

export const mongoDb: Db = mongoClient.db(configuration.databaseName);

export async function ensureMongoIndexes() {
  await Promise.all([
    mongoDb
      .collection("workspaceItems")
      .createIndex(
        { ownerUserId: 1, weddingKey: 1, module: 1, createdAt: 1 },
        { name: "workspace_owner_wedding_module" },
      ),
    mongoDb
      .collection("workspaceItems")
      .createIndex(
        { ownerUserId: 1, weddingKey: 1, module: 1, recordId: 1 },
        { name: "workspace_record", unique: true },
      ),
    mongoDb
      .collection("user")
      .createIndex({ phoneNumber: 1 }, { name: "user_phone_number", unique: true, sparse: true }),
    mongoDb
      .collection("weddingProfiles")
      .createIndex({ ownerUserId: 1 }, { name: "wedding_profile_owner", unique: true }),
    mongoDb
      .collection("weddingProfiles")
      .createIndex({ weddingKey: 1 }, { name: "wedding_profile_key", unique: true }),
    mongoDb
      .collection("vendorProfiles")
      .createIndex({ ownerUserId: 1 }, { name: "vendor_profile_owner", unique: true }),
    mongoDb
      .collection("plannerProfiles")
      .createIndex({ ownerUserId: 1 }, { name: "planner_profile_owner", unique: true }),
    mongoDb
      .collection("vendorRequests")
      .createIndex(
        { coupleUserId: 1, vendorUserId: 1, weddingKey: 1 },
        { name: "couple_vendor_request", unique: true },
      ),
    mongoDb
      .collection("weddingCollaborators")
      .createIndex({ weddingKey: 1, userId: 1 }, { name: "wedding_collaborator", unique: true }),
    mongoDb
      .collection("messages")
      .createIndex(
        { senderUserId: 1, recipientUserId: 1, weddingKey: 1, createdAt: 1 },
        { name: "message_conversation" },
      ),
    mongoDb
      .collection("messages")
      .createIndex({ recipientUserId: 1, readAt: 1, createdAt: -1 }, { name: "message_unread" }),
  ]);
}
