export default function DashboardLoading() {
  return (
    <div className="dashboard-stack" aria-label="Loading dashboard" aria-busy="true">
      <div className="grid gap-3">
        <div className="h-4 w-36 animate-pulse rounded bg-vow-soft" />
        <div className="h-11 w-72 max-w-full animate-pulse rounded-xl bg-vow-soft" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-vow-soft" />
      </div>
      <div className="h-52 animate-pulse rounded-3xl bg-vow-soft" />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-36 animate-pulse rounded-2xl bg-vow-soft" key={index} />
        ))}
      </div>
    </div>
  );
}
