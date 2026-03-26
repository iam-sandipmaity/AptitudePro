import { HeatmapDay } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <div className="glass-card info-card">
      <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="small-label">Streak Calendar</div>
          <h3 style={{ margin: "0.35rem 0 0" }}>Consistency heatmap</h3>
        </div>
        <div className="pill">{days.filter((day) => day.count > 0).length} active days</div>
      </div>
      <div className="heatmap-grid">
        {days.map((day) => {
          const level = day.count >= 4 ? 4 : day.count >= 3 ? 3 : day.count >= 2 ? 2 : day.count >= 1 ? 1 : 0;
          return <div key={day.date} className={`heatmap-cell level-${level}`} title={`${formatDateLabel(day.date)}: ${day.count} attempts`} />;
        })}
      </div>
    </div>
  );
}
