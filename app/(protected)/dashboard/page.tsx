import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { requireAppUser } from "@/lib/auth";
import { getDashboardPayload } from "@/lib/repository";

export default async function DashboardPage() {
  const user = await requireAppUser();
  const dashboard = getDashboardPayload(user.id);

  return (
    <DashboardHome
      name={user.name}
      stats={dashboard.stats}
      heatmap={dashboard.heatmap}
      strongAreas={dashboard.strongAreas}
      weakAreas={dashboard.weakAreas}
      recentAttempts={dashboard.recentAttempts}
    />
  );
}
