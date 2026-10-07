import type { Metadata } from "next";
import { RsvpExperience } from "@/features/guests/RsvpExperience";
import { getTextTranslator } from "@/lib/i18n-server";
import { notFound } from "next/navigation";
import { mongoDb } from "@/lib/mongodb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const text = await getTextTranslator();
  const guest = await mongoDb.collection("workspaceItems").findOne({
    module: "guests",
    "data.inviteToken": token,
    deletedAt: { $exists: false },
  });
  const wedding = guest
    ? await mongoDb.collection("weddingProfiles").findOne({ weddingKey: guest.weddingKey })
    : null;
  const coupleName = String(wedding?.displayName ?? "").trim();
  return {
    title: coupleName
      ? `${coupleName} · ${text("Wedding invitation")}`
      : text("Wedding invitation"),
  };
}
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await mongoDb.collection("workspaceItems").findOne({
    module: "guests",
    "data.inviteToken": token,
    deletedAt: { $exists: false },
  });
  if (!guest) notFound();
  const [wedding, menus] = await Promise.all([
    mongoDb.collection("weddingProfiles").findOne({ weddingKey: guest.weddingKey }),
    mongoDb
      .collection("workspaceItems")
      .find({ weddingKey: guest.weddingKey, module: "food-drinks", deletedAt: { $exists: false } })
      .toArray(),
  ]);
  if (!wedding) notFound();
  return (
    <RsvpExperience
      token={token}
      guestName={String(guest.data?.name ?? "Guest")}
      coupleName={String(wedding.displayName ?? "")}
      weddingDate={String(wedding.weddingDate ?? "")}
      venue={String(wedding.venue ?? "")}
      location={String(wedding.location ?? "")}
      mealOptions={menus.map((menu) => String(menu.data?.name ?? "")).filter(Boolean)}
    />
  );
}
