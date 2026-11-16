// Purpose: import official website images into an isolated Yes Planner environment.
import fs from "node:fs";
import path from "node:path";
import { GridFSBucket, MongoClient } from "mongodb";
import { databaseEnvironment, parseScriptArguments } from "./environment.mjs";
import { detectLogoContentType, normalizeLogoSourceUrl } from "./vendor-logo.mjs";

const maximumPageBytes = 2_000_000;
const maximumImageBytes = 5_000_000;
const maximumPortfolioImages = 6;
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const projectRoot = process.cwd();
const { environment, positional } = parseScriptArguments(process.argv.slice(2));
const apply = positional.includes("--apply");
const dataFile = positional.find((value) => !value.startsWith("--")) ?? "data/data.json";
const vendors = JSON.parse(fs.readFileSync(path.resolve(projectRoot, dataFile), "utf8"));
const { uri, databaseName } = databaseEnvironment(environment);

function absoluteHttpsUrl(value, baseUrl) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), baseUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function candidateImageUrl(value, baseUrl) {
  const url = absoluteHttpsUrl(value, baseUrl);
  if (!url || url.startsWith("data:") || url.includes("#")) return null;
  return url;
}

function extractWebsiteImageUrls(html, pageUrl) {
  const candidates = [];
  const add = (value) => {
    const url = candidateImageUrl(value, pageUrl);
    if (url && !candidates.includes(url)) candidates.push(url);
  };
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/gi)) add(match[1]);
  for (const match of html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)/gi)) add(match[1]);
  for (const match of html.matchAll(/<img[^>]+srcset=["']([^"']+)/gi)) {
    for (const item of match[1].split(",")) add(item.trim().split(/\s+/)[0]);
  }
  for (const match of html.matchAll(/"image"\s*:\s*(?:"([^"]+)"|\[\s*"([^"]+)")/gi)) add(match[1] ?? match[2]);
  return candidates.slice(0, 24);
}

function isLikelyWorkImage(url) {
  // Portfolio selection is based on what an image represents, not its pixel dimensions.
  // A small but relevant venue or wedding-work image is still better than an unrelated large asset.
  return !/(?:logo|favicon|icon|badge|award|certificate|sponsor|partner|avatar|profile|portrait|headshot|team|staff|person|founder|owner|placeholder|pattern|background|sprite|qr[-_]?code|dummy|guest\.png)/i.test(
    url,
  );
}

async function fetchWithLimit(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: "follow", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > (options.image ? maximumImageBytes : maximumPageBytes)) throw new Error("response is too large");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > (options.image ? maximumImageBytes : maximumPageBytes)) throw new Error("response is too large");
  return { response, buffer };
}

async function fetchWebsiteImages(website) {
  const pageUrl = normalizeLogoSourceUrl(website);
  const page = await fetchWithLimit(pageUrl, { headers: { Accept: "text/html,application/xhtml+xml" } });
  const candidates = extractWebsiteImageUrls(page.buffer.toString("utf8"), pageUrl);
  const images = [];
  let profileImage;
  for (const sourceUrl of candidates) {
    if (images.length >= maximumPortfolioImages) break;
    try {
      const result = await fetchWithLimit(sourceUrl, { image: true, headers: { Accept: "image/jpeg,image/png,image/webp" } });
      const contentType = detectLogoContentType(result.buffer, result.response.headers.get("content-type") ?? "");
      if (!contentType || !imageMimeTypes.has(contentType)) continue;
      const image = { buffer: result.buffer, contentType, sourceUrl };
      if (!profileImage && /logo|brand|identity/i.test(sourceUrl)) profileImage = image;
      else if (isLikelyWorkImage(sourceUrl)) images.push(image);
    } catch {
      // One broken gallery image must not prevent the other website images from importing.
    }
  }
  return profileImage ? [profileImage, ...images].slice(0, maximumPortfolioImages + 1) : images.slice(0, maximumPortfolioImages);
}

async function storeImage(database, vendor, image, index) {
  const bucket = new GridFSBucket(database, { bucketName: "vendorMedia" });
  const safeName = vendor.businessName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const upload = bucket.openUploadStream(`${safeName}-website-${index + 1}`, {
    contentType: image.contentType,
    metadata: {
      ownerUserId: null,
      visibility: "public-vendor-profile",
      sourceType: "official-vendor-website",
      sourceUrl: image.sourceUrl,
      businessName: vendor.businessName,
      importedAt: new Date(),
    },
  });
  await new Promise((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", resolve);
    upload.end(image.buffer);
  });
  return `/api/v1/media/${upload.id.toString()}`;
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
let processed = 0;
let imported = 0;
let skipped = 0;
try {
  await client.connect();
  const database = client.db(databaseName);
  for (const vendor of vendors) {
    if (!vendor?.businessName || !vendor.website) {
      skipped += 1;
      continue;
    }
    processed += 1;
    try {
      const images = await fetchWebsiteImages(vendor.website);
      if (!images.length) {
        console.log(`No usable images: ${vendor.businessName}`);
        skipped += 1;
        continue;
      }
      console.log(`${apply ? "Importing" : "Would import"}: ${vendor.businessName} (${images.length} images)`);
      if (!apply) continue;
      const urls = [];
      for (let index = 0; index < images.length; index += 1) urls.push(await storeImage(database, vendor, images[index], index));
      await database.collection("vendorProfiles").updateOne(
        { seeded: true, businessName: vendor.businessName },
        { $set: { profileImage: urls[0], portfolioImages: urls.slice(1), logoSourceUrl: images[0].sourceUrl, updatedAt: new Date() } },
      );
      imported += 1;
    } catch (error) {
      console.log(`Skipped ${vendor.businessName}: ${error instanceof Error ? error.message : "website unavailable"}`);
      skipped += 1;
    }
  }
} finally {
  await client.close();
}
console.log(`Environment: ${environment} (${databaseName})`);
console.log(`Websites checked: ${processed}`);
console.log(`Profiles ${apply ? "updated" : "ready"}: ${imported}`);
console.log(`Skipped: ${skipped}`);
