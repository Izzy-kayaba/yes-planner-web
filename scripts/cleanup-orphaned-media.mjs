import { GridFSBucket, MongoClient } from "mongodb";

const production = process.env.NODE_ENV === "production";
const uri = production
  ? (process.env.MONGODB_PRODUCTION_URI ?? process.env.MONGODB_URI)
  : (process.env.MONGODB_DEVELOPMENT_URI ?? process.env.MONGODB_URI);
const databaseName = production
  ? (process.env.MONGODB_PRODUCTION_DATABASE ?? process.env.MONGODB_DATABASE)
  : (process.env.MONGODB_DEVELOPMENT_DATABASE ?? process.env.MONGODB_DATABASE);

if (!uri || !databaseName) throw new Error("MongoDB URI and database name are required.");

const client = new MongoClient(uri);
try {
  const database = client.db(databaseName);
  const profiles = await database
    .collection("vendorProfiles")
    .find({}, { projection: { profileImage: 1, portfolioImages: 1 } })
    .toArray();
  const referencedUrls = new Set(
    profiles.flatMap((profile) => [profile.profileImage, ...(profile.portfolioImages ?? [])]),
  );
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1_000);
  const orphanedFiles = await database
    .collection("vendorMedia.files")
    .find({ uploadDate: { $lt: cutoff } }, { projection: { _id: 1 } })
    .toArray();
  const bucket = new GridFSBucket(database, { bucketName: "vendorMedia" });
  let deleted = 0;

  for (const file of orphanedFiles) {
    const url = `/api/v1/media/${file._id.toString()}`;
    if (referencedUrls.has(url)) continue;
    await bucket.delete(file._id);
    deleted += 1;
  }

  process.stdout.write(`Deleted ${deleted} unreferenced vendor image(s) older than 24 hours.\n`);
} finally {
  await client.close();
}
