import Link from "next/link";
import { ArrowRight, Flame, Gauge, Target, TimerReset } from "lucide-react";
import { Heatmap } from "@/components/charts/heatmap";
import { CategoryBrowser } from "@/components/ui/category-browser";
import { AttemptSummary, DashboardStats, HeatmapDay, TopicPerformance } from "@/lib/types";
import { formatDuration, formatPercent } from "@/lib/utils";

function MetricCard({ label, value, subcopy, icon: Icon }: { label: string; value: string; subcopy: string; icon: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <div className="soft-card metric-card">
      <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="small-label">{label}</div>
        <Icon size={18} color="var(--accent)" />
      </div>
      <div className="metric-value" style={{ marginTop: 16 }}>{value}</div>
      <div className="muted" style={{ marginTop: 10 }}>{subcopy}</div>
    </div>
  );
}

function PerformanceList({ title, items }: { title: string; items: TopicPerformance[] }) {
  return (
    <div className="glass-card info-card">
      <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3>{title}</h3>
        <span className="pill">Topic-wise</span>
      </div>
      {items.length ? (
        <div className="solution-list">
          {items.map((item) => (
            <div key={item.topicId} className="bar-row">
              <div className="inline-row" style={{ justifyContent: "space-between" }}>
                <span>{item.topicTitle}</span>
                <span className="muted">{formatPercent(item.accuracy)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-value" style={{ width: `${Math.min(item.accuracy, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-note">Your topic analytics will appear after your first completed round.</div>
      )}
    </div>
  );
}

function AttemptHistory({ attempts }: { attempts: AttemptSummary[] }) {
  return (
    <div className="glass-card history-card">
      <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3>Recent attempts</h3>
        <Link href="/test/create" className="button-ghost">New custom test</Link>
      </div>
      {attempts.length ? (
        <div className="solution-list">
          {attempts.map((attempt) => (
            <Link key={attempt.id} href={`/results/${attempt.id}`} className="soft-card topic-card">
              <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <strong>{attempt.topicLabel || "Mixed topics"}</strong>
                <span className="pill">{attempt.mode}</span>
              </div>
              <div className="inline-row">
                <span className="pill">Score {attempt.score}/{attempt.totalQuestions}</span>
                <span className="pill">{formatPercent(attempt.accuracy)}</span>
                <span className="pill">{formatDuration(attempt.timeTakenSec)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-note">No test history yet. Start with a focused practice round or build a custom mock.</div>
      )}
    </div>
  );
}

export function DashboardHome({
  name,
  stats,
  heatmap,
  strongAreas,
  weakAreas,
  recentAttempts
}: {
  name: string;
  stats: DashboardStats;
  heatmap: HeatmapDay[];
  strongAreas: TopicPerformance[];
  weakAreas: TopicPerformance[];
  recentAttempts: AttemptSummary[];
}) {
  return (
    <main className="page-shell section">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 className="section-title" style={{ fontSize: "2.5rem", marginTop: 10 }}>Welcome back, {name.split(" ")[0]}</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>Stay consistent, attack one topic at a time, and let the platform surface your weak spots automatically.</p>
        </div>
        <div className="hero-actions">
          <Link href="/practice" className="button-primary">
            Start Practice
            <ArrowRight size={16} />
          </Link>
          <Link href="/test/create" className="button-secondary">Custom Test</Link>
        </div>
      </div>

      <section className="metric-grid">
        <MetricCard label="Current streak" value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`} subcopy={`Best streak: ${stats.bestStreak}`} icon={Flame} />
        <MetricCard label="Total tests taken" value={`${stats.totalTestsTaken}`} subcopy={`${stats.totalQuestionsAnswered} questions answered`} icon={Gauge} />
        <MetricCard label="Accuracy" value={formatPercent(stats.accuracy)} subcopy="Across completed rounds" icon={Target} />
        <MetricCard label="Avg time per test" value={formatDuration(stats.averageTimePerTest)} subcopy="Balanced for speed and review" icon={TimerReset} />
      </section>

      <section className="two-column" style={{ marginTop: 18 }}>
        <Heatmap days={heatmap} />
        <PerformanceList title="Weak vs strong areas" items={weakAreas.length ? [...weakAreas, ...strongAreas].slice(0, 6) : []} />
      </section>

      <section className="two-column" style={{ marginTop: 18 }}>
        <AttemptHistory attempts={recentAttempts} />
        <div className="glass-card info-card">
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3>Improvement focus</h3>
            <span className="pill">Personalized</span>
          </div>
          {weakAreas.length ? (
            <div className="solution-list">
              {weakAreas.map((item) => (
                <Link key={item.topicId} href={`/practice/${item.topicId}`} className="soft-card topic-card">
                  <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{item.topicTitle}</strong>
                    <span className="pill">{formatPercent(item.accuracy)}</span>
                  </div>
                  <p>Reinforce this area with a focused practice drill and explanation-first review.</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-note">Complete your first round to reveal targeted recommendations.</div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div className="page-header">
          <div>
            <span className="eyebrow">Topic Library</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginTop: 8 }}>Practice catalog</h2>
          </div>
          <div className="pill">220 generated MCQs per topic</div>
        </div>
        <CategoryBrowser />
      </section>
    </main>
  );
}

