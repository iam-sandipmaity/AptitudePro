"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Flag, Timer } from "lucide-react";
import { QuestionMediaView } from "@/components/questions/question-media-view";
import { AttemptRecord, AttemptResponseInput } from "@/lib/types";

function formatClock(totalSeconds: number | null) {
  if (totalSeconds === null) return "No timer";
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ExamRunner({ attempt }: { attempt: AttemptRecord }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSec, setRemainingSec] = useState<number | null>(attempt.timeLimitSec);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set(attempt.questions.filter((question) => question.bookmarked).map((question) => question.id)));
  const [submitting, startTransition] = useTransition();
  const submittedRef = useRef(false);
  const entryRef = useRef(Date.now());

  const [responses, setResponses] = useState<Record<string, AttemptResponseInput>>(() =>
    Object.fromEntries(
      attempt.questions.map((question) => [
        question.id,
        {
          questionId: question.id,
          topicId: question.topicId,
          selectedIndex: null,
          markedForReview: false,
          skipped: true,
          timeSpentSec: 0
        }
      ])
    )
  );

  const responsesRef = useRef(responses);
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  const currentQuestion = attempt.questions[currentIndex];
  const progress = ((currentIndex + 1) / attempt.questions.length) * 100;
  const isInstantMode = attempt.feedbackMode === "instant";
  const currentResponse = responses[currentQuestion.id];
  const currentRevealed = Boolean(revealed[currentQuestion.id]);

  function patchResponse(questionId: string, updater: (value: AttemptResponseInput) => AttemptResponseInput) {
    setResponses((previous) => {
      const next = { ...previous, [questionId]: updater(previous[questionId]) };
      responsesRef.current = next;
      return next;
    });
  }

  function flushCurrentTime() {
    const elapsed = Math.max(0, Math.round((Date.now() - entryRef.current) / 1000));
    if (elapsed > 0) {
      patchResponse(currentQuestion.id, (value) => ({ ...value, timeSpentSec: value.timeSpentSec + elapsed }));
    }
    entryRef.current = Date.now();
  }

  function goTo(index: number) {
    flushCurrentTime();
    setCurrentIndex(index);
  }

  function chooseOption(optionIndex: number) {
    patchResponse(currentQuestion.id, (value) => ({
      ...value,
      selectedIndex: optionIndex,
      skipped: false
    }));
  }

  function toggleReview() {
    patchResponse(currentQuestion.id, (value) => ({ ...value, markedForReview: !value.markedForReview }));
  }

  async function toggleBookmark() {
    const response = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: currentQuestion.id, topicId: currentQuestion.topicId })
    });

    if (!response.ok) return;
    const data = await response.json();
    setBookmarked((previous) => {
      const next = new Set(previous);
      if (data.bookmarked) next.add(currentQuestion.id);
      else next.delete(currentQuestion.id);
      return next;
    });
  }

  async function submitAttempt(force = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const elapsed = Math.max(0, Math.round((Date.now() - entryRef.current) / 1000));
    const payloadMap = {
      ...responsesRef.current,
      [currentQuestion.id]: {
        ...responsesRef.current[currentQuestion.id],
        timeSpentSec: responsesRef.current[currentQuestion.id].timeSpentSec + elapsed
      }
    };

    setResponses(payloadMap);
    responsesRef.current = payloadMap;

    const totalTime = attempt.timeLimitSec ? attempt.timeLimitSec - (remainingSec ?? 0) : Object.values(payloadMap).reduce((sum, item) => sum + item.timeSpentSec, 0);

    const response = await fetch(`/api/tests/${attempt.id}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: Object.values(payloadMap), timeTakenSec: Math.max(totalTime, force ? 1 : totalTime) })
    });

    if (!response.ok) {
      submittedRef.current = false;
      return;
    }

    router.replace(`/results/${attempt.id}`);
  }

  useEffect(() => {
    if (remainingSec === null || submittedRef.current) return undefined;
    const timer = setInterval(() => {
      setRemainingSec((value) => {
        if (value === null) return value;
        if (value <= 1) {
          clearInterval(timer);
          void submitAttempt(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSec]);

  const overview = useMemo(() => attempt.questions.map((question, index) => {
    const response = responses[question.id];
    return {
      id: question.id,
      index,
      answered: response.selectedIndex !== null,
      marked: response.markedForReview
    };
  }), [attempt.questions, responses]);

  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">{attempt.mode === "practice" ? "Practice Round" : "Test Simulation"}</span>
          <h1 className="section-title" style={{ fontSize: "2rem", marginTop: 10 }}>{attempt.totalQuestions} questions, one clean flow</h1>
        </div>
        <div className="review-strip">
          <span className="pill"><Timer size={14} /> {formatClock(remainingSec)}</span>
          <span className="pill">{currentIndex + 1}/{attempt.questions.length}</span>
          <button className="button-secondary" onClick={toggleBookmark}>
            {bookmarked.has(currentQuestion.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} Bookmark
          </button>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 18 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="runner-layout">
        <section className="glass-card runner-card">
          <div className="topic-meta" style={{ justifyContent: "space-between", marginBottom: 18 }}>
            <span className="pill">{currentQuestion.topicId.replace(/-/g, " ")}</span>
            <span className="pill">{currentQuestion.difficulty}</span>
          </div>

          <h2 style={{ marginTop: 0, lineHeight: 1.5 }}>{currentQuestion.prompt}</h2>

          <div style={{ marginTop: 18 }}>
            <QuestionMediaView media={currentQuestion.media} />
          </div>

          <div className="option-list" style={{ marginTop: 22 }}>
            {currentQuestion.options.map((option, optionIndex) => {
              const selected = currentResponse.selectedIndex === optionIndex;
              const revealCorrect = currentRevealed && optionIndex === currentQuestion.answerIndex;
              const revealWrong = currentRevealed && selected && optionIndex !== currentQuestion.answerIndex;
              return (
                <button
                  key={`${currentQuestion.id}-${optionIndex}`}
                  type="button"
                  className={`option-button${selected ? " selected" : ""}${revealCorrect ? " correct" : ""}${revealWrong ? " wrong" : ""}`}
                  onClick={() => chooseOption(optionIndex)}
                  disabled={currentRevealed}
                >
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </button>
              );
            })}
          </div>

          {currentRevealed ? (
            <div className="soft-card info-card" style={{ marginTop: 18 }}>
              <div className="small-label">Explanation</div>
              <p style={{ marginTop: 8 }}>{currentQuestion.explanation}</p>
            </div>
          ) : null}

          <div className="review-strip" style={{ justifyContent: "space-between", marginTop: 22 }}>
            <div className="review-strip">
              <button className="button-secondary" onClick={() => goTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button className="button-secondary" onClick={toggleReview}>
                <Flag size={16} /> {currentResponse.markedForReview ? "Unmark" : "Mark for review"}
              </button>
            </div>

            <div className="review-strip">
              {isInstantMode && !currentRevealed ? (
                <button className="button-secondary" disabled={currentResponse.selectedIndex === null} onClick={() => setRevealed((value) => ({ ...value, [currentQuestion.id]: true }))}>
                  Check answer
                </button>
              ) : null}
              <button className="button-primary" onClick={() => {
                if (currentIndex === attempt.questions.length - 1) {
                  startTransition(() => void submitAttempt());
                  return;
                }
                goTo(currentIndex + 1);
              }} disabled={submitting}>
                {currentIndex === attempt.questions.length - 1 ? (submitting ? "Submitting..." : "Finish round") : "Next question"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <aside className="glass-card runner-card">
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Question map</h3>
            <button className="button-ghost" onClick={() => startTransition(() => void submitAttempt())}>Submit now</button>
          </div>
          <div className="question-grid">
            {overview.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`question-chip${item.index === currentIndex ? " current" : ""}${item.answered ? " answered" : ""}${item.marked ? " marked" : ""}`}
                onClick={() => goTo(item.index)}
              >
                {item.index + 1}
              </button>
            ))}
          </div>
          <div className="solution-list" style={{ marginTop: 18 }}>
            <div className="soft-card topic-card"><strong>Answered</strong><p>{overview.filter((item) => item.answered).length} of {overview.length}</p></div>
            <div className="soft-card topic-card"><strong>Marked</strong><p>{overview.filter((item) => item.marked).length} questions flagged for later review.</p></div>
            <div className="soft-card topic-card"><strong>Feedback mode</strong><p>{attempt.feedbackMode === "instant" ? "Explanations can be revealed during the round." : "Full solutions appear after submission."}</p></div>
          </div>
        </aside>
      </div>
    </main>
  );
}

