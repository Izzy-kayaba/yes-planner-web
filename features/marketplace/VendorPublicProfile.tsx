"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Button } from "@/components/ui/Button";
import { AtSign, BadgeCheck, ExternalLink, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { YesSelect } from "@/components/ui/YesSelect";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { inferMoneyRange, moneyRangeLabel, vendorPriceRanges } from "@/lib/estimate-ranges";
import { BackButton } from "@/components/navigation/BackButton";

export function VendorPublicProfile({
  vendor,
  canRequest,
  requestStatus,
  canClaim,
  profileId,
  claimed,
  claimStatus,
}: {
  vendor: {
    id: string;
    businessName: string;
    contactName: string;
    bio: string;
    services: string[];
    serviceArea: string;
    startingPriceMinor: number;
    startingPriceRangeKey?: string;
    website: string;
    instagramHandle: string;
    profileImage: string;
    portfolioImages: string[];
    phoneNumber: string;
  };
  canRequest: boolean;
  requestStatus?: string;
  canClaim: boolean;
  profileId: string;
  claimed: boolean;
  claimStatus?: string;
}) {
  const router = useRouter();
  const { text, t } = useLanguage();
  const { displayMoney } = useCurrency();
  const [service, setService] = useState(vendor.services[0] ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [currentClaimStatus, setCurrentClaimStatus] = useState(claimStatus);
  const selectedPriceRange = vendorPriceRanges.find(
    (range) =>
      range.id ===
      (vendor.startingPriceRangeKey ||
        inferMoneyRange(vendorPriceRanges, vendor.startingPriceMinor)),
  );

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      await apiRequest("/api/v1/vendor-requests", {
        method: "POST",
        body: JSON.stringify({ vendorUserId: vendor.id, service, message }),
      });
      toast.success(text("Request sent to vendor."));
      router.refresh();
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Request could not be sent."));
    } finally {
      setSending(false);
    }
  }

  async function claimProfile() {
    setClaiming(true);
    try {
      await apiRequest("/api/v1/vendor-profile/claim", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
      setCurrentClaimStatus("Pending");
      toast.success(text("Claim request sent for review."));
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Claim request could not be sent."),
      );
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="section-stack vendor-public-profile">
      <BackButton fallback="/marketplace" />
      <section className="panel vendor-profile-hero">
        <div className="vendor-profile-photo">
          {vendor.profileImage ? (
            <Image
              alt={vendor.businessName}
              fill
              priority
              sizes="220px"
              src={vendor.profileImage}
              unoptimized
            />
          ) : (
            <span>{vendor.businessName.slice(0, 1)}</span>
          )}
        </div>
        <div className="vendor-profile-copy">
          <p className="eyebrow">{vendor.services.map(text).join(" · ")}</p>
          <h1 className="flex items-center gap-4">
            {vendor.businessName}{" "}
            {claimed && (
              <BadgeCheck
                aria-label={text("Verified business")}
                className="vendor-verified-icon"
                size={26}
              />
            )}
          </h1>

          {vendor.contactName && <p className="vendor-contact-name">{vendor.contactName}</p>}
          <p>{vendor.bio}</p>
          <div className="vendor-service-list">
            {vendor.services.map((item) => (
              <span className="vendor-service-chip" key={item}>
                {text(item)}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-yes-muted">
            {vendor.serviceArea} ·{" "}
            {selectedPriceRange
              ? moneyRangeLabel(selectedPriceRange, displayMoney, t)
              : text("Quote required")}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-yes-wine">
            {vendor.phoneNumber && (
              <a
                className="button button-primary"
                href={`https://wa.me/${vendor.phoneNumber.replace(/\D/g, "")}`}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle size={16} /> {text("Message on WhatsApp")}
              </a>
            )}
            {vendor.website && (
              <a
                className="vendor-profile-link"
                href={vendor.website}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={16} /> {text("Visit website")}
              </a>
            )}
            {vendor.instagramHandle && (
              <a
                className="vendor-profile-link"
                href={`https://www.instagram.com/${vendor.instagramHandle.replace(/^@/, "")}`}
                rel="noreferrer"
                target="_blank"
              >
                <AtSign size={16} />
                {vendor.instagramHandle.startsWith("@")
                  ? vendor.instagramHandle
                  : `@${vendor.instagramHandle}`}
              </a>
            )}
          </div>
        </div>
      </section>
      {canClaim && (
        <section className="panel vendor-claim-panel">
          <p className="eyebrow">{text("Is this your business?")}</p>
          <p>
            {currentClaimStatus === "Pending"
              ? text(
                  "Your ownership claim is pending administrator review. You cannot withdraw or submit another claim while it is pending.",
                )
              : currentClaimStatus === "Declined"
                ? text(
                    "Your previous claim was declined. You may submit a new request if you have additional information.",
                  )
                : text(
                    "Create a business account, then request ownership so you can manage this profile and portfolio.",
                  )}
          </p>
          <Button
            disabled={claiming || currentClaimStatus === "Pending"}
            onClick={() => void claimProfile()}
            type="button"
          >
            {claiming
              ? text("Sending…")
              : currentClaimStatus === "Pending"
                ? text("Claim pending review")
                : text("Claim this business")}
          </Button>
        </section>
      )}
      <section className="panel">
        <p className="eyebrow">{text("Portfolio")}</p>
        <h2>{text("Selected work")}</h2>
        {vendor.portfolioImages.length ? (
          <div className="vendor-public-gallery">
            {vendor.portfolioImages.map((image, index) => (
              <div key={`${image.slice(-20)}-${index}`}>
                <Image
                  alt={`${vendor.businessName} work ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  src={image}
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-yes-muted">
            {text("This vendor has not added portfolio images yet.")}
          </p>
        )}
      </section>
      {canRequest && (
        <form
          className="panel onboarding-form vendor-request-form grid gap-4"
          onSubmit={sendRequest}
        >
          <div>
            <p className="eyebrow">{text("Work together")}</p>
            <h2>{text("Send a request")}</h2>
          </div>
          {requestStatus && (
            <p className="rounded-xl bg-yes-soft p-3 text-sm font-bold text-yes-wine">
              {text("Current request status")}: {text(requestStatus)}
            </p>
          )}
          <label>
            <FieldLabel required>{text("Service")}</FieldLabel>
            <YesSelect
              ariaLabel={text("Service")}
              id="vendor-request-service"
              name="service"
              options={vendor.services.map((item) => ({ value: item, label: text(item) }))}
              required
              value={service}
              onChange={setService}
            />
          </label>
          <label>
            {text("Message")}
            <textarea
              id="vendor-request-message"
              maxLength={1000}
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder={text("Tell the vendor what you need for your wedding.")}
              rows={4}
              value={message}
            />
            <CharacterCount value={message} max={1000} />
          </label>
          <Button disabled={sending || requestStatus === "Accepted"} type="submit">
            {sending
              ? text("Sending…")
              : requestStatus === "Accepted"
                ? text("Vendor connected")
                : requestStatus === "Pending"
                  ? text("Update request")
                  : text("Send request")}
          </Button>
        </form>
      )}
    </div>
  );
}
