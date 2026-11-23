import "server-only";

import { mongoDb } from "@/lib/mongodb";

export const publicationStatuses = ["Draft", "Published", "Unpublished", "Archived"] as const;
export type PublicationStatus = (typeof publicationStatuses)[number];

export type WeddingPhoto = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
};

export type WeddingPublication = {
  weddingKey: string;
  displayName: string;
  partnerName: string;
  weddingDate: string;
  hashtag: string;
  story: string;
  venue: string;
  venueAddress: string;
  directionsUrl: string;
  mapUrl: string;
  theme: string;
  publicSlug: string;
  publicationStatus: PublicationStatus;
  photos: WeddingPhoto[];
};

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function defaultPublicSlug(displayName: string, weddingDate: string) {
  return slugify(`${displayName} ${weddingDate.slice(0, 4)}`) || "our-wedding";
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function publicationFromProfile(document: Record<string, unknown>): WeddingPublication {
  const photos = Array.isArray(document.publicPhotos)
    ? document.publicPhotos
        .filter((photo): photo is Record<string, unknown> =>
          Boolean(photo && typeof photo === "object"),
        )
        .map((photo) => ({
          id: text(photo.id),
          url: text(photo.url),
          alt: text(photo.alt) || "Wedding photograph",
          sortOrder: Number(photo.sortOrder ?? 0),
          isCover: photo.isCover === true,
        }))
        .filter((photo) => photo.id && photo.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  return {
    weddingKey: text(document.weddingKey),
    displayName: text(document.displayName),
    partnerName: text(document.partnerName),
    weddingDate: text(document.weddingDate),
    hashtag: text(document.hashtag),
    story: text(document.story),
    venue: text(document.venue),
    venueAddress: text(document.venueAddress),
    directionsUrl: text(document.directionsUrl),
    mapUrl: text(document.mapUrl),
    theme: text(document.publicTheme) || "rose",
    publicSlug: text(document.publicSlug),
    publicationStatus: publicationStatuses.includes(document.publicationStatus as PublicationStatus)
      ? (document.publicationStatus as PublicationStatus)
      : "Draft",
    photos,
  };
}

export async function loadPublishedWedding(slug: string) {
  const profile = await mongoDb.collection("weddingProfiles").findOne({
    publicSlug: slug,
    publicationStatus: "Published",
  });
  return profile ? publicationFromProfile(profile) : null;
}
