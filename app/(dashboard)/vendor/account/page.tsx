import { PageHeader } from "@/components/ui/PageHeader";
import {
  VendorOnboardingForm,
  type VendorOnboardingValue,
} from "@/features/onboarding/VendorOnboardingForm";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export default async function VendorAccountPage() {
  const session = await requirePageRole(["Vendor", "Venue"]);
  const [user, vendor] = await Promise.all([
    mongoDb.collection("user").findOne({ email: session.user.email }),
    mongoDb.collection("vendorProfiles").findOne({ ownerUserId: session.user.id }),
  ]);
  const initialValue: VendorOnboardingValue = {
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
        eyebrow="Vendor account"
        title="Public profile and portfolio"
        description="Keep the profile couples see accurate and show your strongest recent work."
      />
      <VendorOnboardingForm
        accountType={session.user.role === "Venue" ? "Venue" : "Vendor"}
        initialValue={initialValue}
      />
    </div>
  );
}
