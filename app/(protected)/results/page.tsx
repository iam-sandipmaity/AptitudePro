import Link from "next/link";
import { requireAppUser } from "@/lib/auth";
import { getRecentAttempts } from "@/lib/repository";
import { formatDuration, formatPercent } from "@/lib/utils";

export default async function ResultsIndexPage() {
  const user = await requireAppUser();
  const attempts = getRecentAttempts(user.id, 18);

  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Results</span>
          <h1 className="section-title" style={{ fontSize: "2.4rem", marginTop: 10 }}>Your completed rounds</h1>
        </div>
        <Link href="/test/create" className="button-primary">Create new test</Link>
      </div>

      {attempts.length ? (
        <div className="card-grid">
          {attempts.map((attempt) => (
            <Link key={attempt.id} href={`/results/${attempt.id}`} className="soft-card topic-card">
              <h3>{attempt.topicLabel || "Mixed topics"}</h3>
              <p>{attempt.mode === "practice" ? "Focused drill" : "Timed simulation"}</p>
              <div className="review-strip" style={{ marginTop: 12 }}>
                <span className="pill">Score {attempt.score}/{attempt.totalQuestions}</span>
                <span className="pill">{formatPercent(attempt.accuracy)}</span>
                <span className="pill">{formatDuration(attempt.timeTakenSec)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-note">No completed rounds yet. Head to practice or build a custom test.</div>
      )}
    </main>
  );
}
