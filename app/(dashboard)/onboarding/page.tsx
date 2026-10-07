import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  WeddingOnboardingForm,
  type WeddingOnboardingValue,
} from "@/features/onboarding/WeddingOnboardingForm";
import {
  VendorOnboardingForm,
  type VendorOnboardingValue,
} from "@/features/onboarding/VendorOnboardingForm";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export const metadata: Metadata = { title: "Wedding details" };

export default async function OnboardingPage() {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") redirect("/dashboard");
  const session = await requirePageRole(["Couple", "Venue", "Vendor"]);
  const [user, wedding, vendor, venueVendors] = await Promise.all([
    mongoDb.collection("user").findOne({ email: session.user.email }),
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId: session.user.id }),
    mongoDb.collection("vendorProfiles").findOne({ ownerUserId: session.user.id }),
    mongoDb
      .collection("vendorProfiles")
      .find({ published: true, services: "Venue" })
      .project({ businessName: 1 })
      .sort({ businessName: 1 })
      .toArray(),
  ]);
  if (session.user.role === "Vendor" || session.user.role === "Venue") {
    const initialVendor: VendorOnboardingValue = {
      businessName: String(vendor?.businessName ?? ""),
      contactName: String(vendor?.contactName ?? user?.name ?? ""),
      bio: String(vendor?.bio ?? ""),
      services: Array.isArray(vendor?.services) ? vendor.services.map(String) : [],
      serviceArea: String(vendor?.serviceArea ?? ""),
      startingPriceMinor: Number(vendor?.startingPriceMinor ?? 0),
      website: String(vendor?.website ?? ""),
      instagramHandle: String(vendor?.instagramHandle ?? ""),
      profileImage: String(vendor?.profileImage ?? ""),
      portfolioImages: Array.isArray(vendor?.portfolioImages)
        ? vendor.portfolioImages.map(String)
        : [],
    };
    return (
      <div className="section-stack mx-auto w-full max-w-4xl">
        <PageHeader
          eyebrow={session.user.role === "Venue" ? "Venue organisation" : "Vendor workspace"}
          title={vendor ? "Edit your public business profile" : "Set up your business workspace"}
          description="Add the services your business offers and the details couples can view."
        />
        <VendorOnboardingForm accountType={session.user.role} initialValue={initialVendor} />
      </div>
    );
  }
  const initialValue: WeddingOnboardingValue = {
    firstName: String(user?.firstName ?? ""),
    lastName: String(user?.lastName ?? ""),
    phoneNumber: String(user?.phoneNumber ?? ""),
    partnerName: String(wedding?.partnerName ?? ""),
    displayName: String(wedding?.displayName ?? ""),
    weddingDate: String(wedding?.weddingDate ?? ""),
    venue: String(wedding?.venue ?? ""),
    location: String(wedding?.location ?? ""),
    budgetMinor: Number(wedding?.budgetMinor ?? 0),
    estimatedGuests: Number(wedding?.estimatedGuests ?? 0),
    weddingStyle: String(wedding?.weddingStyle ?? ""),
    planningNotes: String(wedding?.planningNotes ?? ""),
  };

  return (
    <div className="section-stack mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow="Your wedding"
        title={wedding ? "Edit your wedding details" : "Let’s personalise your workspace"}
        description="Complete these details before opening wedding-specific planning tools. You can update them later."
      />
      <WeddingOnboardingForm
        initialValue={initialValue}
        venueOptions={venueVendors.map((venueVendor) => String(venueVendor.businessName ?? ""))}
      />
    </div>
  );
}
