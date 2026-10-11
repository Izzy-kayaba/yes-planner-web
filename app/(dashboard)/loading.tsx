// Purpose: implements app/(dashboard)/loading.tsx for the Yes Planner web application.
import { getTextTranslator } from "@/lib/i18n-server";

export default async function DashboardLoading() {
  const text = await getTextTranslator();
  return (
    <div className="route-loader" role="status" aria-label={text("Loading page")}>
      <span />
    </div>
  );
}
