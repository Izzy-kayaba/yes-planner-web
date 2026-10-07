import { currentWedding } from "@/lib/demo-data";
import type { WeddingProfile } from "@/lib/dashboard/types";
import { getTextTranslator } from "@/lib/i18n-server";
import { getInitials } from "@/lib/initials";
import type { PlatformRole } from "@/lib/auth/roles";

export async function WeddingWorkspaceHeader({
  access,
  wedding,
  role,
}: {
  access?: "Owner" | "FullManager" | "Vendor";
  wedding?: WeddingProfile | null;
  role?: PlatformRole;
}) {
  const text = await getTextTranslator();
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const displayName = demoMode ? currentWedding.partnerNames : (wedding?.displayName ?? "");
  const date = demoMode ? currentWedding.date : (wedding?.weddingDate ?? "");

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid size-11 place-items-center rounded-full bg-yes-blush font-display text-sm text-yes-wine">
          <span className="inline-flex items-baseline gap-0.5 leading-none">
            {getInitials(displayName)}
          </span>
        </span>
        <p className="m-0 grid gap-0.5">
          <strong className="font-display text-sm font-normal">{displayName}</strong>
          <small className="text-[11px] text-yes-muted">
            {text(date)}
            {demoMode ? ` · ${currentWedding.daysRemaining} ${text("days")}` : ""}
          </small>
        </p>
      </div>
      <span className="rounded-full border border-yes-line px-2.5 py-1.5 text-[11px] font-extrabold text-yes-muted max-sm:hidden">
        {text(
          access === "FullManager"
            ? "Wedding planner"
            : role === "Vendor"
              ? "Vendor collaborator"
              : "Wedding owner",
        )}
      </span>
    </div>
  );
}
