import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start">
      <div>
        {eyebrow && (
          <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[.18em] text-vow-wine">
            {eyebrow}
          </p>
        )}
        <h1 className="mb-2 font-display text-[clamp(2.125rem,4vw,2.875rem)] leading-none tracking-[-.04em]">
          {title}
        </h1>
        {description && (
          <p className="m-0 max-w-2xl text-[13px] leading-relaxed text-vow-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 max-sm:w-full max-sm:[&>*]:w-full">{action}</div>}
    </header>
  );
}
