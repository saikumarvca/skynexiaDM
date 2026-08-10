import { StatsCard } from "@/components/stats-card";
import { LucideIcon } from "lucide-react";

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function TeamStatsCards({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <StatsCard
          key={s.title}
          title={s.title}
          value={s.value}
          icon={s.icon}
          description={s.description}
        />
      ))}
    </div>
  );
}
