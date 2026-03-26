"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, Lightbulb, Sparkles, WandSparkles } from "lucide-react";
import { AiAttemptAnalysis, AiPracticeSet, AiProblemSolution } from "@/lib/types";

type TopicBreakdown = {
  topicId: string;
  title: string;
  accuracy: number;
  correct: number;
  total: number;
};

type AiReviewPanelProps = {
  attemptId: string;
  topicBreakdown: TopicBreakdown[];
};

type PendingAction = "analyze" | "solve" | "generate" | null;

async function postCoachRequest(body: Record<string, unknown>) {
  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "AI request failed.");
  }

  return data;
}

export function AiReviewPanel({ attemptId, topicBreakdown }: AiReviewPanelProps) {
  const [analysis, setAnalysis] = useState<AiAttemptAnalysis | null>(null);
  const [solution, setSolution] = useState<AiProblemSolution | null>(null);
  const [practiceSet, setPracticeSet] = useState<AiPracticeSet | null>(null);
  const [problemText, setProblemText] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(topicBreakdown[0]?.topicId ?? "");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const suggestedTopic = useMemo(
    () => [...topicBreakdown].sort((left, right) => left.accuracy - right.accuracy)[0]?.topicId ?? selectedTopicId,
    [selectedTopicId, topicBreakdown]
  );

  async function runAction(action: Exclude<PendingAction, null>, body: Record<string, unknown>) {
    setError("");
    setPendingAction(action);

    try {
      const data = await postCoachRequest(body);

      if (action === "analyze") {
        setAnalysis(data.analysis as AiAttemptAnalysis);
      }

      if (action === "solve") {
        setSolution(data.solution as AiProblemSolution);
      }

      if (action === "generate") {
        setPracticeSet(data.practiceSet as AiPracticeSet);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI request failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section style={{ marginTop: 18 }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">AI Coach</span>
          <h2 className="section-title" style={{ fontSize: "2rem", marginTop: 8 }}>Analyze, solve, and generate follow-up practice</h2>
          <p className="section-copy" style={{ marginTop: 10 }}>
            Groq-powered feedback can review this attempt, solve a pasted problem, and set fresh questions around weak topics.
          </p>
        </div>
        <div className="review-strip">
          <span className="pill"><BrainCircuit size={14} /> Attempt analyzer</span>
          <span className="pill"><Lightbulb size={14} /> Problem solver</span>
          <span className="pill"><Sparkles size={14} /> Question setter</span>
        </div>
      </div>

      <div className="two-column">
        <div className="glass-card info-card">
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Attempt analysis</h3>
            <button
              className="button-primary"
              onClick={() => void runAction("analyze", { action: "analyze", attemptId })}
              disabled={pendingAction !== null}
            >
              <WandSparkles size={16} /> {pendingAction === "analyze" ? "Analyzing..." : analysis ? "Refresh analysis" : "Analyze this round"}
            </button>
          </div>

          {analysis ? (
            <div className="solution-list">
              <div className="soft-card info-card">
                <div className="small-label">Overview</div>
                <p style={{ marginTop: 8 }}>{analysis.overview}</p>
              </div>
              <div className="ai-grid">
                <div className="soft-card info-card">
                  <div className="small-label">Strengths</div>
                  <div className="ai-list" style={{ marginTop: 10 }}>
                    {analysis.strengths.map((item, index) => <p key={`strength-${index}-${item}`}>{item}</p>)}
                  </div>
                </div>
                <div className="soft-card info-card">
                  <div className="small-label">Weaknesses</div>
                  <div className="ai-list" style={{ marginTop: 10 }}>
                    {analysis.weaknesses.map((item, index) => <p key={`weakness-${index}-${item}`}>{item}</p>)}
                  </div>
                </div>
                <div className="soft-card info-card">
                  <div className="small-label">Pacing notes</div>
                  <div className="ai-list" style={{ marginTop: 10 }}>
                    {analysis.pacing.map((item, index) => <p key={`pacing-${index}-${item}`}>{item}</p>)}
                  </div>
                </div>
                <div className="soft-card info-card">
                  <div className="small-label">Action plan</div>
                  <div className="ai-list" style={{ marginTop: 10 }}>
                    {analysis.actionPlan.map((item, index) => <p key={`action-${index}-${item}`}>{item}</p>)}
                  </div>
                </div>
              </div>
              <div className="review-strip">
                {analysis.recommendedTopics.map((item, index) => <span key={`recommended-${index}-${item}`} className="pill">{item}</span>)}
              </div>
            </div>
          ) : (
            <div className="empty-note">Run the analyzer to get strengths, weak areas, pacing notes, and a short improvement plan.</div>
          )}
        </div>

        <div className="glass-card info-card">
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>AI problem solver</h3>
            <span className="pill">{topicBreakdown.length} topics in this round</span>
          </div>

          <div className="field">
            <label>Focus topic</label>
            <select value={selectedTopicId} onChange={(event) => setSelectedTopicId(event.target.value)}>
              {topicBreakdown.map((item) => (
                <option key={item.topicId} value={item.topicId}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Paste any aptitude problem or interview question</label>
            <textarea
              value={problemText}
              onChange={(event) => setProblemText(event.target.value)}
              rows={7}
              placeholder="Example: A train crosses a pole in 12 seconds and a platform in 20 seconds..."
            />
          </div>

          <button
            className="button-primary"
            style={{ marginTop: 16 }}
            disabled={pendingAction !== null || !problemText.trim()}
            onClick={() => void runAction("solve", { action: "solve", attemptId, topicId: selectedTopicId || suggestedTopic, prompt: problemText.trim() })}
          >
            <Lightbulb size={16} /> {pendingAction === "solve" ? "Solving..." : "Solve with AI"}
          </button>

          {solution ? (
            <div className="solution-list" style={{ marginTop: 16 }}>
              <div className="soft-card info-card">
                <div className="small-label">Summary</div>
                <p style={{ marginTop: 8 }}>{solution.summary}</p>
              </div>
              <div className="soft-card info-card">
                <div className="small-label">Step-by-step</div>
                <div className="ai-list" style={{ marginTop: 10 }}>
                  {solution.steps.map((item, index) => <p key={`step-${index}-${item}`}>{item}</p>)}
                </div>
              </div>
              <div className="soft-card info-card">
                <div className="small-label">Answer</div>
                <p style={{ marginTop: 8 }}>{solution.answer}</p>
              </div>
              {solution.shortcut ? (
                <div className="soft-card info-card">
                  <div className="small-label">Shortcut</div>
                  <p style={{ marginTop: 8 }}>{solution.shortcut}</p>
                </div>
              ) : null}
              {solution.pitfalls.length ? (
                <div className="review-strip">
                  {solution.pitfalls.map((item, index) => <span key={`pitfall-${index}-${item}`} className="pill">{item}</span>)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-card info-card" style={{ marginTop: 18 }}>
        <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="small-label">Follow-up Practice</div>
            <h3 style={{ marginTop: 6 }}>Generate fresh questions from weak spots</h3>
          </div>
          <button
            className="button-secondary"
            disabled={pendingAction !== null}
            onClick={() => void runAction("generate", { action: "generate", attemptId, topicId: selectedTopicId || suggestedTopic, count: 3 })}
          >
            <Sparkles size={16} /> {pendingAction === "generate" ? "Generating..." : "Set 3 new questions"}
          </button>
        </div>

        {practiceSet ? (
          <div className="solution-list">
            <p className="section-copy">{practiceSet.intro}</p>
            {practiceSet.questions.map((question, index) => (
              <details key={`${question.prompt}-${index}`} className="soft-card solution-card" open={index === 0}>
                <summary style={{ cursor: "pointer", listStyle: "none" }}>
                  <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <strong>AI Q{index + 1}. {question.prompt}</strong>
                    <span className="pill">{question.difficulty}</span>
                  </div>
                </summary>
                <div className="solution-list" style={{ marginTop: 16 }}>
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={`${question.prompt}-${optionIndex}`}
                      className="soft-card topic-card"
                      style={{ borderColor: optionIndex === question.answerIndex ? "rgba(114, 228, 184, 0.45)" : undefined }}
                    >
                      <strong>{String.fromCharCode(65 + optionIndex)}. {option}</strong>
                      <p>{optionIndex === question.answerIndex ? "Correct option" : "Option"}</p>
                    </div>
                  ))}
                  <div className="soft-card info-card">
                    <div className="small-label">Explanation</div>
                    <p style={{ marginTop: 8 }}>{question.explanation}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="empty-note">Generate a short practice set and the AI will write new MCQs tailored to this attempt.</div>
        )}

        {error ? <p style={{ color: "var(--danger)", marginTop: 16 }}>{error}</p> : null}
      </div>
    </section>
  );
}
