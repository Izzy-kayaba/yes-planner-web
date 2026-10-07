import { NextResponse } from "next/server";
import { z } from "zod";
import { mongoDb } from "@/lib/mongodb";

type RouteContext = { params: Promise<{ token: string }> };
const responseSchema = z.object({
  response: z.enum(["yes", "no"]),
  mealPreference: z.string().max(160).optional(),
  dietaryNotes: z.string().max(500).default(""),
});

// The unguessable invitation token limits public RSVP updates to one guest record.
export async function PATCH(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const parsed = responseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Invalid RSVP response." }, { status: 400 });
  const guest = await mongoDb.collection("workspaceItems").findOne({
    module: "guests",
    "data.inviteToken": token,
    deletedAt: { $exists: false },
  });
  if (!guest) return NextResponse.json({ message: "Invitation not found." }, { status: 404 });
  if (parsed.data.response === "yes") {
    const meal = await mongoDb.collection("workspaceItems").findOne({
      ownerUserId: guest.ownerUserId,
      weddingKey: guest.weddingKey,
      module: "food-drinks",
      "data.name": parsed.data.mealPreference,
      deletedAt: { $exists: false },
    });
    if (!meal)
      return NextResponse.json({ message: "Choose an available meal option." }, { status: 400 });
  }
  const result = await mongoDb.collection("workspaceItems").updateOne(
    { _id: guest._id, deletedAt: { $exists: false } },
    {
      $set: {
        "data.status": parsed.data.response === "yes" ? "Attending" : "Declined",
        "data.meal": parsed.data.response === "yes" ? parsed.data.mealPreference : "",
        "data.dietaryNotes": parsed.data.dietaryNotes,
        updatedAt: new Date(),
      },
    },
  );
  if (!result.matchedCount)
    return NextResponse.json({ message: "Invitation not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
