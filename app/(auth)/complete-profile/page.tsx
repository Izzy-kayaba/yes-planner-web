import { redirect } from "next/navigation";
import { AuthHeading } from "@/features/auth/AuthHeading";
import { ProfileCompletionForm } from "@/features/auth/ProfileCompletionForm";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export default async function CompleteProfilePage() {
  const session = await requirePageRole();
  const user = await mongoDb.collection("user").findOne({ email: session.user.email });
  if (user?.phoneNumber) redirect("/dashboard");
  return (
    <div className="auth-card">
      <AuthHeading mode="register" />
      <div className="alert alert-info mb-5">
        A valid phone number is required before you continue.
      </div>
      <ProfileCompletionForm
        firstName={String(user?.firstName ?? "")}
        lastName={String(user?.lastName ?? "")}
      />
    </div>
  );
}
