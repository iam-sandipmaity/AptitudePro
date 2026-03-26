"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopicCategory } from "@/lib/types";

export function TestBuilder({ categories }: { categories: TopicCategory[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(() => { const initial = categories[0]?.topics[0]?.id; return initial ? [initial] : []; });
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitSec, setTimeLimitSec] = useState(20 * 60);
  const [feedbackMode, setFeedbackMode] = useState<"instant" | "end">("end");
  const [isPending, startTransition] = useTransition();

  const selectedCountLabel = useMemo(() => `${selected.length} topic${selected.length === 1 ? "" : "s"} selected`, [selected]);

  function toggle(topicId: string) {
    setSelected((current) => (current.includes(topicId) ? current.filter((item) => item !== topicId) : [...current, topicId]));
  }

  async function startTest() {
    if (!selected.length) return;

    const response = await fetch("/api/tests/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "test",
        feedbackMode,
        topicIds: selected,
        totalQuestions: questionCount,
        timeLimitSec
      })
    });

    if (!response.ok) return;
    const data = await response.json();
    router.push(`/test/${data.attemptId}`);
  }

  return (
    <div className="two-column">
      <div className="glass-card info-card">
        <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div className="small-label">Custom Test</div>
            <h3 style={{ margin: "0.4rem 0 0" }}>Select topics</h3>
          </div>
          <span className="pill">{selectedCountLabel}</span>
        </div>

        <div className="topic-browser">
          {categories.map((category, index) => (
            <details key={category.id} className="soft-card topic-group" open={index < 2}>
              <summary>
                <span>{category.title}</span>
                <span className="muted">{category.topics.length} topics</span>
              </summary>
              <div className="topic-list">
                {category.topics.map((topic) => {
                  const active = selected.includes(topic.id);
                  return (
                    <button
                      type="button"
                      key={topic.id}
                      className="soft-card topic-card"
                      style={{ textAlign: "left", borderColor: active ? "rgba(114, 228, 184, 0.45)" : undefined, background: active ? "rgba(114, 228, 184, 0.08)" : undefined }}
                      onClick={() => toggle(topic.id)}
                    >
                      <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{topic.title}</strong>
                        <span className="pill">{active ? "Selected" : `${topic.questionCount} MCQs`}</span>
                      </div>
                      <p>{topic.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="glass-card info-card">
        <div className="small-label">Simulation Settings</div>
        <h3 style={{ marginTop: 8 }}>Build your timed round</h3>
        <p className="section-copy" style={{ marginTop: 8 }}>Pick the size, pace, and feedback style that matches your current training goal.</p>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Number of questions</label>
          <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
            <option value={50}>50 questions</option>
          </select>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Time limit</label>
          <select value={timeLimitSec} onChange={(event) => setTimeLimitSec(Number(event.target.value))}>
            <option value={10 * 60}>10 minutes</option>
            <option value={20 * 60}>20 minutes</option>
            <option value={30 * 60}>30 minutes</option>
            <option value={45 * 60}>45 minutes</option>
          </select>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Feedback</label>
          <select value={feedbackMode} onChange={(event) => setFeedbackMode(event.target.value as "instant" | "end")}>
            <option value="end">After test only</option>
            <option value="instant">Instant reveal</option>
          </select>
        </div>

        <div className="review-strip" style={{ marginTop: 18 }}>
          <span className="pill">Skip and revisit</span>
          <span className="pill">Mark for review</span>
          <span className="pill">Detailed solutions</span>
        </div>

        <button className="button-primary" style={{ width: "100%", marginTop: 22 }} disabled={!selected.length || isPending} onClick={() => startTransition(() => { void startTest(); })}>
          {isPending ? "Creating test..." : "Start full simulation"}
        </button>
      </div>
    </div>
  );
}

