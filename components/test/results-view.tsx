import Link from "next/link";
import { QuestionMediaView } from "@/components/questions/question-media-view";
import { AiReviewPanel } from "@/components/test/ai-review-panel";
import { AttemptRecord, AttemptResponseRecord } from "@/lib/types";
import { formatDuration, formatPercent } from "@/lib/utils";
import { getTopicById } from "@/data/topic-catalog";

export function ResultsView({
  attempt,
  responses
}: {
  attempt: AttemptRecord;
  responses: Record<string, AttemptResponseRecord>;
}) {
  const uniqueTopicIds = [...new Set(attempt.topicIds)];

  const topicBreakdown = uniqueTopicIds.map((topicId) => {
    const topicQuestions = attempt.questions.filter((question) => question.topicId === topicId);
    const correct = topicQuestions.filter((question) => responses[question.id]?.isCorrect).length;
    const total = topicQuestions.length;
    return {
      topicId,
      title: getTopicById(topicId)?.title ?? topicId,
      accuracy: total ? (correct / total) * 100 : 0,
      correct,
      total
    };
  });

  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Results</span>
          <h1 className="section-title" style={{ fontSize: "2.3rem", marginTop: 10 }}>Round complete</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>Review what changed, what slowed you down, and which topics need another pass.</p>
        </div>
        <div className="review-strip">
          <Link href="/practice" className="button-secondary">Back to practice</Link>
          <Link href="/test/create" className="button-primary">Build another test</Link>
        </div>
      </div>

      <section className="metric-grid">
        <div className="soft-card metric-card"><div className="small-label">Score</div><div className="metric-value">{attempt.score}/{attempt.totalQuestions}</div></div>
        <div className="soft-card metric-card"><div className="small-label">Accuracy</div><div className="metric-value">{formatPercent(attempt.accuracy)}</div></div>
        <div className="soft-card metric-card"><div className="small-label">Time taken</div><div className="metric-value">{formatDuration(attempt.timeTakenSec)}</div></div>
        <div className="soft-card metric-card"><div className="small-label">Correct vs wrong</div><div className="metric-value">{attempt.correctCount} / {attempt.wrongCount}</div></div>
      </section>

      <section className="two-column" style={{ marginTop: 18 }}>
        <div className="glass-card info-card">
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3>Topic performance</h3>
            <span className="pill">Improvement over time</span>
          </div>
          <div className="solution-list">
            {topicBreakdown.map((item) => (
              <div key={item.topicId} className="bar-row">
                <div className="inline-row" style={{ justifyContent: "space-between" }}>
                  <span>{item.title}</span>
                  <span className="muted">{item.correct}/{item.total}</span>
                </div>
                <div className="bar-track"><div className="bar-value" style={{ width: `${Math.min(item.accuracy, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card info-card">
          <h3 style={{ marginTop: 0 }}>How to use this review</h3>
          <div className="solution-list" style={{ marginTop: 16 }}>
            <div className="soft-card topic-card"><strong>Re-run weak topics</strong><p>Use focused practice on the areas that dropped below your target accuracy.</p></div>
            <div className="soft-card topic-card"><strong>Bookmark patterns</strong><p>Tricky distractors often repeat by pattern. Mark them and revisit after a break.</p></div>
            <div className="soft-card topic-card"><strong>Protect your pace</strong><p>Use timed mocks to improve decision speed once your accuracy stabilizes.</p></div>
          </div>
        </div>
      </section>

      <AiReviewPanel attemptId={attempt.id} topicBreakdown={topicBreakdown} />

      <section style={{ marginTop: 18 }}>
        <div className="page-header">
          <div>
            <span className="eyebrow">Solutions</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginTop: 8 }}>Detailed review</h2>
          </div>
          <div className="pill">{attempt.questions.length} questions</div>
        </div>
        <div className="solution-list">
          {attempt.questions.map((question, index) => {
            const response = responses[question.id];
            return (
              <details key={question.id} className="glass-card solution-card" open={index < 3}>
                <summary style={{ cursor: "pointer", listStyle: "none" }}>
                  <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Q{index + 1}. {question.prompt}</strong>
                    <span className="pill">{response?.isCorrect ? "Correct" : "Review"}</span>
                  </div>
                </summary>
                <div className="solution-list" style={{ marginTop: 16 }}>
                  <QuestionMediaView media={question.media} />
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.answerIndex;
                    const isSelected = response?.selectedIndex === optionIndex;
                    return (
                      <div key={`${question.id}-${optionIndex}`} className="soft-card topic-card" style={{ borderColor: isCorrect ? "rgba(114, 228, 184, 0.45)" : isSelected ? "rgba(255, 138, 138, 0.4)" : undefined }}>
                        <strong>{String.fromCharCode(65 + optionIndex)}. {option}</strong>
                        <p>
                          {isCorrect ? "Correct option" : isSelected ? "Your selection" : "Distractor"}
                        </p>
                      </div>
                    );
                  })}
                  <div className="soft-card info-card">
                    <div className="small-label">Explanation</div>
                    <p style={{ marginTop: 8 }}>{question.explanation}</p>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}
