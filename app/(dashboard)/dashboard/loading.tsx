// Purpose: implements app/(dashboard)/dashboard/loading.tsx for the Yes Planner web application.
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

export default function DashboardLoading() {
  return <WorkspaceSkeleton variant="dashboard" label="Loading dashboard" />;
}
