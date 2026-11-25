// Purpose: provides a consistent loading surface for authenticated workspace pages.
import { cn } from "@/lib/cn";

type WorkspaceSkeletonProps = {
  className?: string;
  label?: string;
  variant?:
    | "page"
    | "dashboard"
    | "compact"
    | "table"
    | "budget"
    | "bookings"
    | "timeline"
    | "publication"
    | "vendors";
  columns?: number;
  rows?: number;
};

export function WorkspaceSkeleton({
  className,
  label = "Loading workspace",
  variant = "page",
  columns = 5,
  rows = 6,
}: WorkspaceSkeletonProps) {
  if (variant === "table") {
    return (
      <section
        className={cn("panel table-panel workspace-skeleton workspace-table-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <div className="table-toolbar">
          <span className="skeleton-block h-10 w-56 max-w-full" />
          <span className="skeleton-block h-10 w-32" />
        </div>
        <div className="workspace-skeleton-table-grid">
          <div
            className="workspace-skeleton-table-row workspace-skeleton-table-head"
            data-columns={columns}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }, (_, index) => (
              <span className="skeleton-block h-3" key={index} />
            ))}
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div
              className="workspace-skeleton-table-row"
              data-columns={columns}
              key={row}
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }, (_, column) => (
                <span className="skeleton-block h-4" key={column} />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "budget") {
    return (
      <div
        className={cn("section-stack workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <section className="budget-summary-card workspace-budget-skeleton">
          <div className="grid gap-3">
            <span className="skeleton-block h-3 w-40" />
            <span className="skeleton-block h-10 w-36" />
            <span className="skeleton-block h-3 w-64 max-w-full" />
          </div>
          <span className="skeleton-block size-28 rounded-full" />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div className="grid gap-2">
              <span className="skeleton-block h-3 w-28" />
              <span className="skeleton-block h-6 w-56" />
            </div>
            <span className="skeleton-block h-10 w-36" />
          </div>
          <div className="budget-bars workspace-budget-rows">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="budget-row" key={index}>
                <span className="skeleton-block h-4 w-32" />
                <span className="skeleton-block h-3 w-40" />
                <span className="skeleton-block h-7 w-16" />
                <span className="skeleton-block h-2 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (variant === "vendors") {
    return (
      <section
        className={cn("vendor-grid workspace-vendor-skeleton workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {Array.from({ length: rows }, (_, index) => (
          <article className="vendor-card workspace-vendor-skeleton-card" key={index}>
            <div className="vendor-cover workspace-vendor-skeleton-cover">
              <span className="skeleton-block size-10 rounded-full" />
            </div>
            <div className="vendor-card-copy">
              <div>
                <span className="skeleton-block h-3 w-24 max-w-full" />
                <span className="skeleton-block h-5 w-20 max-w-full rounded-full" />
              </div>
              <span className="skeleton-block h-6 w-40 max-w-full" />
              <span className="skeleton-block h-3 w-36 max-w-full" />
              <span className="skeleton-block h-4 w-24 max-w-full" />
              <div className="flex gap-2">
                <span className="skeleton-block h-9 w-24" />
                <span className="skeleton-block size-9 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </section>
    );
  }

  if (variant === "bookings") {
    return (
      <div
        className={cn("section-stack workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <div className="table-toolbar">
          <span className="skeleton-block h-10 w-56 max-w-full" />
          <span className="skeleton-block h-10 w-32" />
        </div>
        <section className="booking-board workspace-booking-skeleton">
          {Array.from({ length: 3 }, (_, column) => (
            <div className="booking-column" key={column}>
              <div className="booking-column-title">
                <span className="skeleton-block h-5 w-28" />
                <span className="skeleton-block size-6 rounded-full" />
              </div>
              {Array.from({ length: 2 }, (_, card) => (
                <article className="booking-card" key={card}>
                  <span className="skeleton-block h-3 w-24" />
                  <span className="skeleton-block h-5 w-36" />
                  <span className="skeleton-block h-6 w-28" />
                  <span className="skeleton-block h-3 w-44 max-w-full" />
                  <span className="skeleton-block h-9 w-20" />
                </article>
              ))}
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <section
        className={cn("dashboard-grid timeline-grid workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <article className="panel">
          <div className="panel-header">
            <div className="grid gap-2">
              <span className="skeleton-block h-3 w-32" />
              <span className="skeleton-block h-6 w-40" />
            </div>
            <div className="flex gap-2">
              <span className="skeleton-block size-9 rounded-lg" />
              <span className="skeleton-block size-9 rounded-lg" />
            </div>
          </div>
          <span className="skeleton-block h-80 w-full rounded-xl" />
        </article>
        <article className="panel">
          <div className="panel-header">
            <div className="grid gap-2">
              <span className="skeleton-block h-3 w-20" />
              <span className="skeleton-block h-6 w-48" />
            </div>
            <span className="skeleton-block h-10 w-28" />
          </div>
          <div className="grid gap-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="flex items-center gap-3" key={index}>
                <span className="skeleton-block h-3 w-12" />
                <span className="skeleton-block size-3 rounded-full" />
                <span className="grid flex-1 gap-2">
                  <span className="skeleton-block h-4 w-40 max-w-full" />
                  <span className="skeleton-block h-3 w-56 max-w-full" />
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    );
  }

  if (variant === "publication") {
    return (
      <div
        className={cn("publication-builder publication-skeleton workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <section className="panel">
          <span className="skeleton-block h-3 w-28" />
          <span className="skeleton-block mt-3 h-9 w-80 max-w-full" />
          <span className="skeleton-block mt-3 h-4 w-full max-w-2xl" />
        </section>
        <section className="panel">
          <span className="skeleton-block h-3 w-36" />
          <span className="skeleton-block mt-3 h-7 w-72 max-w-full" />
          <div className="publication-skeleton-fields">
            <span className="skeleton-block h-24 rounded-xl" />
            <span className="skeleton-block h-24 rounded-xl" />
          </div>
        </section>
        <section className="panel">
          <span className="skeleton-block h-3 w-32" />
          <span className="skeleton-block mt-3 h-7 w-64 max-w-full" />
          <span className="skeleton-block mt-5 h-28 w-full rounded-xl" />
        </section>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn("workspace-skeleton workspace-skeleton-compact", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <span className="skeleton-block h-5 w-40" />
        <span className="skeleton-block h-28 w-full" />
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div
        className={cn("dashboard-stack workspace-skeleton", className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <div className="grid gap-3">
          <span className="skeleton-block h-4 w-36" />
          <span className="skeleton-block h-11 w-72 max-w-full" />
          <span className="skeleton-block h-4 w-full max-w-xl" />
        </div>
        <span className="skeleton-block h-52 w-full rounded-3xl" />
        <div className="stats-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <span className="skeleton-block h-36 rounded-2xl" key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("section-stack workspace-skeleton", className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className="grid gap-3">
        <span className="skeleton-block h-4 w-32" />
        <span className="skeleton-block h-11 w-80 max-w-full" />
        <span className="skeleton-block h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <span className="skeleton-block h-44 rounded-2xl" />
        <span className="skeleton-block h-44 rounded-2xl" />
      </div>
      <span className="skeleton-block h-56 w-full rounded-2xl" />
    </div>
  );
}
