"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Link2,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { WeddingPhoto, WeddingPublication } from "@/lib/wedding-publication";
import { VenueAddressAutocomplete } from "@/features/weddings/VenueAddressAutocomplete";

export function WeddingPublicationBuilder({ initial }: { initial: WeddingPublication }) {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { language, text } = useLanguage();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const publicUrl =
    typeof window === "undefined"
      ? `/wedding/${value.publicSlug}`
      : `${window.location.origin}/wedding/${value.publicSlug}`;

  function update(field: keyof WeddingPublication, next: string) {
    setValue((current) => ({ ...current, [field]: next }));
  }

  function updateVenueAddress(details: { address: string; mapUrl: string; directionsUrl: string }) {
    setValue((current) => ({
      ...current,
      venueAddress: details.address,
      mapUrl: details.mapUrl,
      directionsUrl: details.directionsUrl,
    }));
  }

  const hasSelectedVenue = Boolean(value.venueAddress.trim() && value.mapUrl.trim());
  const mapPreviewUrl = hasSelectedVenue
    ? `https://www.google.com/maps?q=${encodeURIComponent(value.venueAddress)}&output=embed`
    : "";

  async function save(action: "save" | "publish" | "unpublish") {
    setSaving(true);
    try {
      const result = await apiRequest<WeddingPublication>(
        `/api/v1/weddings/${encodeURIComponent(weddingId)}/publication`,
        {
          method: "PUT",
          body: JSON.stringify({ ...value, action }),
        },
      );
      setValue(result);
      toast.success(
          action === "publish"
          ? text("Your wedding page is live.")
          : action === "unpublish"
            ? text("Your page is now private.")
            : text("Website draft saved."),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The wedding page could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(files?: File | FileList) {
    const selected = files instanceof File ? [files] : files ? Array.from(files) : [];
    const imageFiles = selected.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );
    const availableSlots = Math.max(0, 30 - value.photos.length);
    if (!imageFiles.length) {
      toast.error(text("Choose JPG, PNG or WebP images."));
      return;
    }
    if (imageFiles.length > availableSlots) {
      toast.error(
        text(`You can add ${availableSlots} more image${availableSlots === 1 ? "" : "s"}.`),
      );
      return;
    }
    setUploading(true);
    try {
      for (const file of imageFiles) {
        const form = new FormData();
        form.append("file", file);
        const photo = await apiRequest<WeddingPhoto>(
          `/api/v1/weddings/${encodeURIComponent(weddingId)}/publication/photos`,
          { method: "POST", body: form },
        );
        setValue((current) => ({ ...current, photos: [...current.photos, photo] }));
      }
      toast.success(text(`${imageFiles.length} photo${imageFiles.length === 1 ? "" : "s"} added.`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(photo: WeddingPhoto) {
    try {
      await apiRequest(
        `/api/v1/weddings/${encodeURIComponent(weddingId)}/publication/photos/${photo.id}`,
        { method: "DELETE" },
      );
      setValue((current) => ({
        ...current,
        photos: current.photos.filter((item) => item.id !== photo.id),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo could not be removed.");
    }
  }

  async function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.photos.length) return;
    const photos = [...value.photos];
    [photos[index], photos[target]] = [photos[target], photos[index]];
    const ordered = photos.map((photo, photoIndex) => ({ ...photo, sortOrder: photoIndex }));
    setValue((current) => ({ ...current, photos: ordered }));
    await apiRequest(`/api/v1/weddings/${encodeURIComponent(weddingId)}/publication/photos`, {
      method: "PUT",
      body: JSON.stringify({ photos: ordered }),
    });
  }

  async function setCover(photoId: string) {
    const ordered = value.photos.map((photo, index) => ({
      ...photo,
      sortOrder: index,
      isCover: photo.id === photoId,
    }));
    setValue((current) => ({ ...current, photos: ordered }));
    try {
      await apiRequest(`/api/v1/weddings/${encodeURIComponent(weddingId)}/publication/photos`, {
        method: "PUT",
        body: JSON.stringify({ photos: ordered }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The cover image could not be saved.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="publication-builder">
      <section className="panel publication-builder-intro">
        <div>
          <p className="eyebrow">{text("Wedding website")}</p>
          <h2>{text("Build the page your guests will see")}</h2>
          <p>
            {text(
              "Keep it private while you work. When everything feels right, publish it and share one simple address.",
            )}
          </p>
        </div>
        <span
          className={`status-pill ${value.publicationStatus === "Published" ? "status-pill-sage" : "status-pill-gold"}`}
        >
          {value.publicationStatus === "Published" ? text("Published") : text("Draft")}
        </span>
      </section>

      <section className="panel publication-builder-section">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("1 · Publication content")}</p>
            <h3>{text("Choose what guests should see")}</h3>
          </div>
        </div>
        <div className="publication-summary-grid">
          <div>
            <span className="field-label">{text("Couple")}</span>
            <strong>{value.displayName || text("Wedding couple")}</strong>
          </div>
          <div>
            <span className="field-label">{text("Wedding date")}</span>
            <strong>{formatWeddingDate(value.weddingDate, language)}</strong>
          </div>
          <div>
            <span className="field-label">{text("Public address")}</span>
            <strong className="publication-generated-address">
              yes-planner.com/wedding/{value.publicSlug || "generated-on-save"}
            </strong>
          </div>
          <label>
            <span className="field-label">{text("Hashtag")}</span>
            <input
              value={value.hashtag}
              onChange={(event) => update("hashtag", event.target.value)}
              placeholder="#EmmaAndJames"
            />
          </label>
        </div>
        <label>
            <span className="field-label">
              {text("Your story")} <em>({text("optional")})</em>
          </span>
          <textarea
            rows={5}
            value={value.story}
            onChange={(event) => update("story", event.target.value)}
            placeholder={text("Tell guests how your story began…")}
          />
        </label>
      </section>

      <section className="panel publication-builder-section">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("2 · Guest-facing details")}</p>
            <h3>{text("Help guests arrive with confidence")}</h3>
          </div>
        </div>
        <div className="venue-details-layout">
          <div className="venue-details-fields">
            <div className="publication-readonly-field">
              <span className="field-label">{text("Venue name")} *</span>
              <input aria-label={text("Venue name")} readOnly value={value.venue || text("Not provided yet")} />
              <small className="field-help">{text("Managed from your wedding details.")}</small>
            </div>
            <label>
              <span className="field-label">Venue address *</span>
              <VenueAddressAutocomplete value={value.venueAddress} onChange={updateVenueAddress} />
            </label>
            <label>
                <span className="field-label">
                {text("Directions link")} <em>({text("optional")})</em>
              </span>
              <input
                inputMode="url"
                onChange={(event) => update("directionsUrl", event.target.value)}
                placeholder={text("https://www.google.com/maps/...")}
                type="url"
                value={value.directionsUrl}
              />
            </label>
          </div>
          <div
            className={`venue-map-preview ${hasSelectedVenue ? "has-location" : "is-placeholder"}`}
          >
            {hasSelectedVenue ? (
              <iframe
                title={`Map showing ${value.venueAddress}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapPreviewUrl}
              />
            ) : (
              <div className="venue-map-empty" aria-live="polite">
                <span>{text("Choose a suggested address to place your venue accurately.")}</span>
              </div>
            )}
            {value.directionsUrl || value.mapUrl ? (
              <a href={value.directionsUrl || value.mapUrl} rel="noreferrer" target="_blank">
                {text("Open in Google Maps")} <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel publication-builder-section">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("3 · Photos and design")}</p>
            <h3>{text("Choose the feeling of the page")}</h3>
          </div>
        </div>
        <div className="theme-choices" role="radiogroup" aria-label="Visual theme">
          {(
            [
              ["rose", "Rose"],
              ["blush", "Blush"],
              ["terracotta", "Terracotta"],
              ["sage", "Sage"],
              ["ocean", "Ocean"],
              ["lavender", "Lavender"],
              ["night", "Night"],
            ] as const
          ).map(([theme, label]) => (
            <button
              className={`theme-choice theme-choice-${theme} ${value.theme === theme ? "selected" : ""}`}
              key={theme}
              onClick={() => update("theme", theme)}
              type="button"
            >
              <span />
              {text(label)}
            </button>
          ))}
        </div>
        <label
          className={`publication-upload ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!uploading) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!uploading) void upload(event.dataTransfer.files);
          }}
        >
          <span className="publication-upload-content">
            <ImagePlus size={20} />
            <span>
              <strong>{uploading ? text("Uploading…") : text("Add wedding photos")}</strong>
              <small>
                {uploading
                  ? text("Please wait while your images are added")
                  : text("Drop images here or browse · JPG, PNG or WebP · up to 30 images")}
              </small>
            </span>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            multiple
            onChange={(event) => void upload(event.target.files ?? undefined)}
            type="file"
          />
        </label>
        {value.photos.length ? (
          <div className="publication-photo-grid">
            {value.photos.map((photo, index) => (
              <article
                className={`publication-photo ${photo.isCover ? "is-cover" : ""}`}
                key={photo.id}
              >
                <img alt={photo.alt} src={photo.url} />
                <div className="publication-photo-actions">
                  <button
                    aria-label={text("Move photo up")}
                    disabled={index === 0}
                    onClick={() => void reorder(index, -1)}
                    type="button"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label={text("Move photo down")}
                    disabled={index === value.photos.length - 1}
                    onClick={() => void reorder(index, 1)}
                    type="button"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    aria-label={text("Remove photo")}
                    onClick={() => void remove(photo)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {photo.isCover ? (
                  <span className="publication-cover-label">{text("Cover image")}</span>
                ) : (
                  <button
                    className="publication-set-cover"
                    onClick={() => void setCover(photo.id)}
                    type="button"
                  >
                    {text("Use as cover")}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="publication-empty-photos">
            {text("Your first photo becomes the cover image automatically.")}
          </div>
        )}
      </section>

      <section className="panel publication-preview-card">
        <div>
          <p className="eyebrow">{text("4 · Preview and publication")}</p>
          <h3>
            {value.publicationStatus === "Published"
              ? text("Your page is live")
              : text("Ready when you are")}
          </h3>
          <p>
            {value.publicationStatus === "Published"
              ? text("Share the address below with your guests.")
              : text("Save a draft to keep working privately, or publish when the story is complete.")}
          </p>
        </div>
        <div className="publication-link">
          <Link2 size={15} />
          <span>{publicUrl}</span>
          <button onClick={() => void copyLink()} type="button">
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? text("Copied") : text("Copy link")}
          </button>
        </div>
        <div className="publication-actions">
          <button
            className="button button-secondary"
            disabled={saving}
            onClick={() => void save("save")}
            type="button"
          >
            {text("Save draft")}
          </button>
          <a
            className="button button-secondary"
            href={`/wedding-preview/${encodeURIComponent(weddingId)}`}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={15} /> {text("Preview privately")}
          </a>
          {value.publicationStatus === "Published" ? (
            <>
              <a
                className="button button-secondary"
                href={publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={15} /> {text("View page")}
              </a>
              <button
                className="button button-primary"
                disabled={saving}
                onClick={() => void save("unpublish")}
                type="button"
              >
                {text("Unpublish")}
              </button>
            </>
          ) : (
            <button
              className="button button-primary"
              disabled={saving}
              onClick={() => void save("publish")}
              type="button"
            >
              {saving ? text("Publishing…") : text("Publish page")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function formatWeddingDate(value: string, language: "en" | "fr") {
  if (!value) return language === "fr" ? "Non renseignée" : "Not provided yet";
  return new Intl.DateTimeFormat(language === "fr" ? "fr-ZA" : "en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
