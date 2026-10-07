import "server-only";

import { ObjectId } from "mongodb";
import { mongoDb } from "@/lib/mongodb";
import { sendEventEmail } from "@/lib/email";

async function phoneForUser(userId: string) {
  const user = await mongoDb
    .collection("user")
    .findOne(ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId }, {
      projection: { phoneNumber: 1, whatsappNotifications: 1 },
    });
  return user?.whatsappNotifications === true && typeof user.phoneNumber === "string"
    ? user.phoneNumber.replace(/\D/g, "")
    : "";
}

export async function sendWhatsAppEvent(userId: string, eventDescription: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const senderId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_NOTIFICATION_TEMPLATE;
  if (!token || !senderId || !template) return;
  const phone = await phoneForUser(userId);
  if (!phone) return;
  const version = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v22.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${senderId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: eventDescription }] }],
      },
    }),
  });
  if (!response.ok) throw new Error("WhatsApp notification delivery failed.");
}

export async function sendWhatsAppToPhone(phoneNumber: string, eventDescription: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const senderId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_NOTIFICATION_TEMPLATE;
  if (!token || !senderId || !template) return;
  const response = await fetch(
    `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_API_VERSION ?? "v22.0"}/${senderId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber.replace(/\D/g, ""),
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: eventDescription }] }],
        },
      }),
    },
  );
  if (!response.ok) throw new Error("WhatsApp notification delivery failed.");
}

export async function notifyUserEvent(userId: string, eventDescription: string) {
  const user = await mongoDb
    .collection("user")
    .findOne(ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId }, {
      projection: { email: 1 },
    });
  await Promise.allSettled([
    sendWhatsAppEvent(userId, eventDescription),
    typeof user?.email === "string"
      ? sendEventEmail(user.email, "Yes Planner update", eventDescription)
      : Promise.resolve(),
  ]);
}

export async function notifyWeddingParticipants(
  weddingKey: string,
  actorUserId: string,
  eventDescription: string,
) {
  const [wedding, collaborators] = await Promise.all([
    mongoDb
      .collection("weddingProfiles")
      .findOne({ weddingKey }, { projection: { ownerUserId: 1 } }),
    mongoDb
      .collection("weddingCollaborators")
      .find({ weddingKey, status: "Active" })
      .project({ userId: 1 })
      .toArray(),
  ]);
  const recipients = new Set([
    String(wedding?.ownerUserId ?? ""),
    ...collaborators.map((item) => String(item.userId ?? "")),
  ]);
  recipients.delete("");
  recipients.delete(actorUserId);
  await Promise.allSettled(
    [...recipients].map((userId) => notifyUserEvent(userId, eventDescription)),
  );
}
