import { currentWedding } from "@/lib/demo-data";
import { getTextTranslator } from "@/lib/i18n-server";

export async function WeddingWorkspaceHeader() {
  const text = await getTextTranslator();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid size-11 place-items-center rounded-full bg-vow-blush font-display text-sm text-vow-wine">
          <span className="inline-flex items-baseline gap-0.5 leading-none">
            R<span className="text-[11px] italic">&</span>I
          </span>
        </span>
        <p className="m-0 grid gap-0.5">
          <strong className="font-display text-sm font-normal">
            {currentWedding.partnerNames}
          </strong>
          <small className="text-[11px] text-vow-muted">
            {text(currentWedding.date)} · {currentWedding.daysRemaining} {text("days")}
          </small>
        </p>
      </div>
      <span className="rounded-full border border-vow-line px-2.5 py-1.5 text-[11px] font-extrabold text-vow-muted max-sm:hidden">
        {text("Wedding owner")}
      </span>
    </div>
  );
}
