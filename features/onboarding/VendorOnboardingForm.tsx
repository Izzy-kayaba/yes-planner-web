"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api/client";
import { vendorServices, weddingPlanningService } from "@/lib/vendors/services";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  inferMoneyRange,
  moneyRangeLabel,
  moneyRangeValue,
  vendorPriceRanges,
} from "@/lib/estimate-ranges";
import { YesSelect } from "@/components/ui/YesSelect";
import { countryOptions } from "@/lib/countries";

export type VendorOnboardingValue = {
  businessName: string;
  contactName: string;
  bio: string;
  services: string[];
  serviceArea: string;
  countryCode: string;
  startingPriceMinor: number;
  startingPriceRangeKey?: string;
  website: string;
  instagramHandle: string;
  profileImage: string;
  portfolioImages: string[];
};

const emptyValue: VendorOnboardingValue = {
  businessName: "",
  contactName: "",
  bio: "",
  services: [],
  serviceArea: "",
  countryCode: "",
  startingPriceMinor: 0,
  website: "",
  instagramHandle: "",
  profileImage: "",
  portfolioImages: [],
};

type ClaimableProfile = {
  id: string;
  businessName: string;
  services: string[];
  serviceArea: string;
};

async function uploadImage(file: File) {
  const body = new FormData();
  body.set("file", file);
  return apiRequest<{ id: string; url: string }>("/api/v1/media", { method: "POST", body });
}

async function removeImage(url: string) {
  const id = url.split("/").at(-1);
  if (id) await apiRequest(`/api/v1/media/${id}`, { method: "DELETE" });
}

export function VendorOnboardingForm({
  accountType = "Vendor",
  initialValue,
}: {
  accountType?: "Vendor" | "Venue";
  initialValue?: VendorOnboardingValue;
}) {
  const router = useRouter();
  const { language, text, t } = useLanguage();
  const { currency, displayMoney } = useCurrency();
  const [value, setValue] = useState(() => {
    const startingValue = initialValue ?? emptyValue;
    if (accountType !== "Venue") return startingValue;
    const services = startingValue.services.filter((service) => service !== weddingPlanningService);
    if (!services.includes("Venue")) services.unshift("Venue");
    return { ...startingValue, services };
  });
  const [saving, setSaving] = useState(false);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [claimableProfiles, setClaimableProfiles] = useState<ClaimableProfile[]>([]);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState("");
  const [claimsLoading, setClaimsLoading] = useState(false);

  useEffect(() => {
    if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "api") return;
    const controller = new AbortController();
    setClaimsLoading(true);
    fetch("/api/v1/vendor-profile/claimable", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Business listings could not be loaded.");
        return (await response.json()) as ClaimableProfile[];
      })
      .then(setClaimableProfiles)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error(
          text(error instanceof Error ? error.message : "Business listings could not be loaded."),
        );
      })
      .finally(() => setClaimsLoading(false));
    return () => controller.abort();
  }, [text]);

  function update<K extends keyof VendorOnboardingValue>(
    field: K,
    nextValue: VendorOnboardingValue[K],
  ) {
    setValue((current) => ({ ...current, [field]: nextValue }));
  }

  function toggleService(service: string) {
    if (accountType === "Venue" && (service === "Venue" || service === weddingPlanningService))
      return;
    update(
      "services",
      value.services.includes(service)
        ? value.services.filter((item) => item !== service)
        : [...value.services, service],
    );
  }

  async function selectProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadImage(file);
      if (value.profileImage) setRemovedImages((current) => [...current, value.profileImage]);
      update("profileImage", uploaded.url);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Invalid image."));
    }
  }

  async function addPortfolioImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6 - value.portfolioImages.length);
    try {
      const images = await Promise.all(files.map(uploadImage));
      update("portfolioImages", [...value.portfolioImages, ...images.map((image) => image.url)]);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Invalid image."));
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.services.length) {
      toast.error(text("Select at least one service."));
      return;
    }
    const startingPriceRangeKey =
      value.startingPriceRangeKey ||
      inferMoneyRange(vendorPriceRanges, value.startingPriceMinor) ||
      vendorPriceRanges[0].id;
    const startingPriceRange = vendorPriceRanges.find(
      (range) => range.id === startingPriceRangeKey,
    )!;
    setSaving(true);
    try {
      await apiRequest("/api/v1/vendor-profile", {
        method: "PUT",
        body: JSON.stringify({
          ...value,
          startingPriceMinor: moneyRangeValue(startingPriceRange),
          startingPriceRangeKey,
        }),
      });
      if (selectedBusinessProfileId) {
        await apiRequest("/api/v1/vendor-profile/claim", {
          method: "POST",
          body: JSON.stringify({ profileId: selectedBusinessProfileId }),
        });
      }
      await Promise.all(removedImages.map((image) => removeImage(image).catch(() => undefined)));
      setRemovedImages([]);
      toast.success(text("Vendor profile saved."));
      router.push("/vendor");
      router.refresh();
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Vendor profile could not be saved."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel onboarding-form grid gap-6" onSubmit={save}>
      <div className="onboarding-section-heading">
        <span>1</span>
        <div>
          <h2>{text("Business profile")}</h2>
          <p>{text("This information appears in marketplace searches and your public profile.")}</p>
        </div>
      </div>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("Business name")}</FieldLabel>
          <input
            id="vendor-business-name"
            name="businessName"
            onChange={(event) => update("businessName", event.target.value)}
            required
            value={value.businessName}
          />
        </label>
        <label>
          <FieldLabel required>{text("Contact name")}</FieldLabel>
          <input
            id="vendor-contact-name"
            name="contactName"
            onChange={(event) => update("contactName", event.target.value)}
            required
            value={value.contactName}
          />
        </label>
      </div>
      <label>
        <FieldLabel required>{text("Business description")}</FieldLabel>
        <textarea
          id="vendor-description"
          maxLength={2000}
          minLength={30}
          name="bio"
          onChange={(event) => update("bio", event.target.value)}
          placeholder={text(
            "Describe your approach, experience and what makes your service special.",
          )}
          required
          rows={5}
          value={value.bio}
        />
        <CharacterCount value={value.bio} min={30} max={2000} />
      </label>

      <div className="onboarding-section-heading">
        <span>2</span>
        <div>
          <h2>
            <FieldLabel required>{text("Services offered")}</FieldLabel>
          </h2>
          <p>{text("Choose every service couples can request from you.")}</p>
        </div>
      </div>
      <div className="service-picker">
        {vendorServices
          .filter((service) => accountType !== "Venue" || service !== weddingPlanningService)
          .map((service) => (
            <button
              aria-pressed={value.services.includes(service)}
              aria-disabled={accountType === "Venue" && service === "Venue"}
              className={value.services.includes(service) ? "selected" : ""}
              key={service}
              onClick={() => toggleService(service)}
              type="button"
            >
              {text(service)}
            </button>
          ))}
      </div>
      <div className="form-row">
        <label>
          <FieldLabel required>{text("Service area")}</FieldLabel>
          <YesSelect
            ariaLabel={text("Service area")}
            id="vendor-service-area"
            name="serviceArea"
            onChange={(countryCode) =>
              setValue((current) => ({ ...current, serviceArea: countryCode, countryCode }))
            }
            options={countryOptions(language)}
            placeholder={text("Select a country")}
            required
            value={value.serviceArea || value.countryCode}
          />
        </label>
        <label>
          <FieldLabel required>
            {text("Starting price range")} ({currency})
          </FieldLabel>
          <YesSelect
            ariaLabel={text("Starting price range")}
            id="vendor-price-range"
            name="startingPriceRangeKey"
            onChange={(rangeKey) => {
              const range = vendorPriceRanges.find((item) => item.id === rangeKey)!;
              setValue((current) => ({
                ...current,
                startingPriceRangeKey: rangeKey,
                startingPriceMinor: moneyRangeValue(range),
              }));
            }}
            options={vendorPriceRanges.map((range) => ({
              value: range.id,
              label: moneyRangeLabel(range, displayMoney, t),
            }))}
            placeholder={text("Select a price range")}
            required
            value={
              value.startingPriceRangeKey ||
              inferMoneyRange(vendorPriceRanges, value.startingPriceMinor)
            }
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          {text("Website")}
          <input
            id="vendor-website"
            name="website"
            onChange={(event) => update("website", event.target.value)}
            placeholder="https://"
            type="url"
            value={value.website}
          />
        </label>
        <label>
          {text("Instagram handle")}
          <input
            id="vendor-instagram"
            name="instagramHandle"
            onChange={(event) => update("instagramHandle", event.target.value)}
            placeholder="@business"
            value={value.instagramHandle}
          />
        </label>
      </div>
      <label>
        <FieldLabel>{text("Claim an existing business listing (optional)")}</FieldLabel>
        <YesSelect
          ariaLabel={text("Business listing to claim")}
          disabled={claimsLoading}
          onChange={setSelectedBusinessProfileId}
          options={[
            {
              value: "",
              label: claimsLoading
                ? text("Loading listings…")
                : text("Create a new business profile"),
            },
            ...claimableProfiles.map((profile) => ({
              value: profile.id,
              label: `${profile.businessName}${profile.serviceArea ? ` · ${profile.serviceArea}` : ""}`,
            })),
          ]}
          value={selectedBusinessProfileId}
        />
        <small className="form-hint">
          {text(
            "If you claim a listing, an administrator must verify it. Your account creation will still complete if a claim needs review.",
          )}
        </small>
      </label>

      <div className="onboarding-section-heading">
        <span>3</span>
        <div>
          <h2>{text("Profile image")}</h2>
          <p>{text("Choose the main image that represents your business in search results.")}</p>
        </div>
      </div>
      <label className="image-upload-tile profile-upload">
        {value.profileImage ? (
          <Image alt="" fill sizes="180px" src={value.profileImage} unoptimized />
        ) : (
          <>
            <ImagePlus />
            <span>{text("Profile image")}</span>
          </>
        )}
        <input
          accept="image/jpeg,image/png,image/webp"
          hidden
          id="vendor-profile-image"
          name="profileImage"
          onChange={selectProfileImage}
          type="file"
        />
      </label>
      <div className="onboarding-section-heading">
        <span>4</span>
        <div>
          <h2>{text("Portfolio images")}</h2>
          <p>
            {text(
              "Show selected examples of your work. These images are separate from your profile image.",
            )}
          </p>
        </div>
      </div>
      <div className="portfolio-upload-list">
        {value.portfolioImages.map((image, index) => (
          <div className="portfolio-upload-preview" key={`${image.slice(-20)}-${index}`}>
            <Image alt="" fill sizes="140px" src={image} unoptimized />
            <button
              aria-label={text("Remove image")}
              onClick={() => {
                setRemovedImages((current) => [...current, image]);
                update(
                  "portfolioImages",
                  value.portfolioImages.filter((_, item) => item !== index),
                );
              }}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {value.portfolioImages.length < 6 && (
          <label className="image-upload-tile">
            <ImagePlus />
            <span>{text("Add work")}</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              hidden
              id="vendor-portfolio-images"
              name="portfolioImages"
              multiple
              onChange={addPortfolioImages}
              type="file"
            />
          </label>
        )}
      </div>
      <small>{text("Up to 6 JPG, PNG or WebP images, each smaller than 5 MB.")}</small>
      <div className="settings-actions">
        <Button disabled={saving} type="submit">
          {saving ? text("Saving…") : text("Save and continue")}
        </Button>
      </div>
    </form>
  );
}
