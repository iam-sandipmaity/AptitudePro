"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, Zap } from "lucide-react";
import { Topic } from "@/lib/types";

export function PracticeConfigurator({ topic }: { topic: Topic }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(15);
  const [feedbackMode, setFeedbackMode] = useState<"instant" | "end">("instant");
  const [isPending, startTransition] = useTransition();

  async function launchPractice() {
    const response = await fetch("/api/tests/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "practice",
        feedbackMode,
        topicIds: [topic.id],
        totalQuestions: questionCount,
        timeLimitSec: null
      })
    });

    if (!response.ok) return;
    const data = await response.json();
    router.push(`/test/${data.attemptId}`);
  }

  return (
    <div className="solution-list">
      <div className="glass-card info-card">
        <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div className="small-label">Focused Drill</div>
            <h3 style={{ margin: "0.4rem 0 0" }}>Set a short round</h3>
          </div>
          <span className="pill"><Zap size={14} /> explanation-ready</span>
        </div>

        <div className="three-column">
          <div className="field">
            <label>Topic</label>
            <input value={topic.title} readOnly />
          </div>
          <div className="field">
            <label>Questions</label>
            <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="field">
            <label>Feedback</label>
            <select value={feedbackMode} onChange={(event) => setFeedbackMode(event.target.value as "instant" | "end")}>
              <option value="instant">Instant feedback</option>
              <option value="end">End-of-test feedback</option>
            </select>
          </div>
        </div>

        <div className="review-strip" style={{ marginTop: 18 }}>
          <span className="pill">{topic.questionCount} generated MCQs</span>
          <span className="pill">Exam-style distractors</span>
          <span className="pill">Bookmark during review</span>
        </div>

        <button
          className="button-primary"
          style={{ marginTop: 20 }}
          onClick={() => startTransition(() => { void launchPractice(); })}
          disabled={isPending}
        >
          {isPending ? "Preparing..." : "Start focused practice"}
        </button>
      </div>

      <div className="glass-card info-card practice-mode-card">
        <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div className="small-label">Try Mode</div>
            <h3 style={{ margin: "0.4rem 0 0" }}>No timer, no count, just keep going</h3>
          </div>
          <span className="pill"><Bot size={14} /> optional Groq AI</span>
        </div>

        <p className="section-copy">
          Jump into one-question-at-a-time practice instantly. Skip, solve, or ask the AI assistant for help only when you need it.
        </p>

        <div className="review-strip" style={{ marginTop: 18 }}>
          <span className="pill">One-by-one questions</span>
          <span className="pill">No setup friction</span>
          <span className="pill"><Sparkles size={14} /> guided help on demand</span>
        </div>

        <Link href={`/practice/${topic.id}/try`} className="button-secondary" style={{ marginTop: 20 }}>
          Open try mode
        </Link>
      </div>
    </div>
  );
}
