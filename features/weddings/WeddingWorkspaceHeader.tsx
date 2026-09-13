import { currentWedding } from "@/lib/demo-data";

export function WeddingWorkspaceHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid size-11 place-items-center rounded-full bg-vow-blush font-display text-sm text-vow-wine">
          A<span className="text-[9px] italic">&</span>S
        </span>
        <p className="m-0 grid gap-0.5">
          <strong className="font-display text-sm font-normal">
            {currentWedding.partnerNames}
          </strong>
          <small className="text-[9px] text-vow-muted">
            {currentWedding.date} · {currentWedding.daysRemaining} days
          </small>
        </p>
      </div>
      <span className="rounded-full border border-vow-line px-2.5 py-1.5 text-[9px] font-extrabold text-vow-muted max-sm:hidden">
        Wedding owner
      </span>
    </div>
  );
}
