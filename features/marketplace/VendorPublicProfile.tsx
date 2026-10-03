"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Button } from "@/components/ui/Button";
import { AtSign, ExternalLink, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { YesSelect } from "@/components/ui/YesSelect";

export function VendorPublicProfile({
  vendor,
  canRequest,
  requestStatus,
}: {
  vendor: {
    id: string;
    businessName: string;
    contactName: string;
    bio: string;
    services: string[];
    serviceArea: string;
    startingPriceMinor: number;
    website: string;
    instagramHandle: string;
    profileImage: string;
    portfolioImages: string[];
    phoneNumber: string;
  };
  canRequest: boolean;
  requestStatus?: string;
}) {
  const router = useRouter();
  const { text } = useLanguage();
  const { displayMoney } = useCurrency();
  const [service, setService] = useState(vendor.services[0] ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
      toast.error(error instanceof Error ? error.message : text("Request could not be sent."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section-stack vendor-public-profile">
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
          <h1>{vendor.businessName}</h1>
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
            {vendor.startingPriceMinor
              ? `${text("From")} ${displayMoney(vendor.startingPriceMinor)}`
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
        <form className="panel onboarding-form grid gap-4" onSubmit={sendRequest}>
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
            {text("Service")}
            <YesSelect
              ariaLabel={text("Service")}
              options={vendor.services.map((item) => ({ value: item, label: text(item) }))}
              value={service}
              onChange={setService}
            />
          </label>
          <label>
            {text("Message")}
            <textarea
              onChange={(event) => setMessage(event.target.value)}
              placeholder={text("Tell the vendor what you need for your wedding.")}
              rows={4}
              value={message}
            />
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
