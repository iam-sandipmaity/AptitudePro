"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bot, ChevronRight, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { QuestionMediaView } from "@/components/questions/question-media-view";
import { AiProblemSolution, Question, Topic } from "@/lib/types";

type PracticeTryModeProps = {
  topic: Topic;
};

type SessionStats = {
  seen: number;
  answered: number;
  correct: number;
  skipped: number;
  streak: number;
  bestStreak: number;
};

async function fetchNextQuestion(topicId: string, seenQuestionIds: string[]) {
  const response = await fetch("/api/practice/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicId, seenQuestionIds })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Could not load the next question.");
  }

  return data as { question: Question; wrapped: boolean };
}

async function askAiForQuestion(topicId: string, topicTitle: string, question: Question, userPrompt: string) {
  const mediaContext = question.media
    ? `\nVisual context: ${question.media.alt}${question.media.caption ? ` (${question.media.caption})` : ""}`
    : "";

  const defaultPrompt = `Explain this question clearly, identify the correct option, and teach a fast solving approach.\n\nQuestion: ${question.prompt}${mediaContext}\nOptions:\n${question.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n")}`;

  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "solve",
      topicId,
      prompt: userPrompt.trim() ? `${defaultPrompt}\n\nLearner question: ${userPrompt.trim()}` : defaultPrompt
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `AI assistant is unavailable for ${topicTitle} right now.`);
  }

  return data.solution as AiProblemSolution;
}

export function PracticeTryMode({ topic }: PracticeTryModeProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [rotationNote, setRotationNote] = useState("");
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSolution, setAiSolution] = useState<AiProblemSolution | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    seen: 0,
    answered: 0,
    correct: 0,
    skipped: 0,
    streak: 0,
    bestStreak: 0
  });
  const [isLoadingQuestion, startQuestionTransition] = useTransition();
  const [isLoadingAi, startAiTransition] = useTransition();
  const initializedRef = useRef(false);

  function loadQuestion(nextSeenQuestionIds: string[]) {
    startQuestionTransition(() => {
      void (async () => {
        try {
          setError("");
          const result = await fetchNextQuestion(topic.id, nextSeenQuestionIds);
          setCurrentQuestion(result.question);
          setSelectedIndex(null);
          setRevealed(false);
          setAiPrompt("");
          setAiSolution(null);
          setRotationNote(result.wrapped ? "You completed the full topic loop, so we started cycling fresh questions again." : "");
          setSeenQuestionIds(result.wrapped ? [result.question.id] : [...nextSeenQuestionIds, result.question.id]);
          setStats((previous) => ({ ...previous, seen: previous.seen + 1 }));
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the next question.");
        }
      })();
    });
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadQuestion([]);
  }, []);

  function checkAnswer() {
    if (!currentQuestion || selectedIndex === null || revealed) {
      return;
    }

    const isCorrect = selectedIndex === currentQuestion.answerIndex;
    setRevealed(true);
    setStats((previous) => {
      const nextStreak = isCorrect ? previous.streak + 1 : 0;
      return {
        ...previous,
        answered: previous.answered + 1,
        correct: previous.correct + (isCorrect ? 1 : 0),
        streak: nextStreak,
        bestStreak: Math.max(previous.bestStreak, nextStreak)
      };
    });
  }

  function moveToNextQuestion() {
    if (!currentQuestion) {
      return;
    }

    if (!revealed) {
      setStats((previous) => ({
        ...previous,
        skipped: previous.skipped + 1,
        streak: 0
      }));
    }

    loadQuestion(seenQuestionIds);
  }

  function solveWithAi() {
    if (!currentQuestion) {
      return;
    }

    startAiTransition(() => {
      void (async () => {
        try {
          setError("");
          const solution = await askAiForQuestion(topic.id, topic.title, currentQuestion, aiPrompt);
          setAiSolution(solution);
        } catch (solveError) {
          setError(solveError instanceof Error ? solveError.message : "AI assistant could not solve this question.");
        }
      })();
    });
  }

  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <div className="try-mode-layout">
      <section className="glass-card runner-card">
        <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <span className="eyebrow">Try Mode</span>
            <h2 style={{ margin: "0.45rem 0 0", lineHeight: 1.15 }}>One question at a time, no timer pressure</h2>
          </div>
          <div className="review-strip">
            <span className="pill">{topic.title}</span>
            <span className="pill">{currentQuestion?.difficulty ?? "Loading"}</span>
          </div>
        </div>

        {rotationNote ? <div className="soft-card info-card" style={{ marginBottom: 16 }}><p>{rotationNote}</p></div> : null}
        {error ? <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p> : null}

        {currentQuestion ? (
          <>
            <div className="soft-card info-card" style={{ marginBottom: 18 }}>
              <div className="small-label">Question</div>
              <p style={{ marginTop: 8, color: "var(--text)", lineHeight: 1.7 }}>{currentQuestion.prompt}</p>
            </div>

            <QuestionMediaView media={currentQuestion.media} />

            <div className="option-list">
              {currentQuestion.options.map((option, optionIndex) => {
                const selected = selectedIndex === optionIndex;
                const revealCorrect = revealed && optionIndex === currentQuestion.answerIndex;
                const revealWrong = revealed && selected && optionIndex !== currentQuestion.answerIndex;
                return (
                  <button
                    key={`${currentQuestion.id}-${optionIndex}`}
                    type="button"
                    className={`option-button${selected ? " selected" : ""}${revealCorrect ? " correct" : ""}${revealWrong ? " wrong" : ""}`}
                    onClick={() => setSelectedIndex(optionIndex)}
                  >
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </button>
                );
              })}
            </div>

            {revealed ? (
              <div className="soft-card info-card" style={{ marginTop: 18 }}>
                <div className="small-label">Explanation</div>
                <p style={{ marginTop: 8 }}>{currentQuestion.explanation}</p>
              </div>
            ) : null}

            <div className="review-strip" style={{ justifyContent: "space-between", marginTop: 22 }}>
              <div className="review-strip">
                <button className="button-secondary" onClick={checkAnswer} disabled={selectedIndex === null || revealed}>
                  <Lightbulb size={16} /> {revealed ? "Answer checked" : "Check answer"}
                </button>
                <button className="button-secondary" onClick={moveToNextQuestion} disabled={isLoadingQuestion}>
                  <RefreshCw size={16} /> {isLoadingQuestion ? "Loading..." : revealed ? "Next question" : "Skip and switch"}
                </button>
              </div>

              <Link href={`/practice/${topic.id}`} className="button-ghost">Back to setup</Link>
            </div>
          </>
        ) : (
          <div className="empty-note">Loading your first question...</div>
        )}
      </section>

      <aside className="glass-card info-card">
        <div className="small-label">Session Snapshot</div>
        <h3 style={{ marginTop: 8 }}>Stay in motion</h3>
        <div className="solution-list" style={{ marginTop: 16 }}>
          <div className="soft-card topic-card"><strong>Seen</strong><p>{stats.seen} question{stats.seen === 1 ? "" : "s"} in this session.</p></div>
          <div className="soft-card topic-card"><strong>Accuracy</strong><p>{accuracy}% after {stats.answered} checked answer{stats.answered === 1 ? "" : "s"}.</p></div>
          <div className="soft-card topic-card"><strong>Rhythm</strong><p>{stats.correct} correct, {stats.skipped} skipped, best streak {stats.bestStreak}.</p></div>
        </div>

        <div className="small-label" style={{ marginTop: 22 }}>Optional Groq AI assistant</div>
        <p className="section-copy" style={{ marginTop: 8 }}>Use it only when you want a guided explanation, shortcut, or concept rescue on the current question.</p>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Ask something specific, or leave it blank for a full explanation</label>
          <textarea
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            rows={5}
            placeholder="Example: give me a hint first, or explain the fastest way to solve this"
          />
        </div>

        <button className="button-primary" style={{ marginTop: 14, width: "100%" }} onClick={solveWithAi} disabled={!currentQuestion || isLoadingAi}>
          <Bot size={16} /> {isLoadingAi ? "Thinking..." : "Ask AI assistant"}
        </button>

        {aiSolution ? (
          <div className="solution-list" style={{ marginTop: 16 }}>
            <div className="soft-card info-card">
              <div className="small-label">AI summary</div>
              <p style={{ marginTop: 8 }}>{aiSolution.summary}</p>
            </div>
            <div className="soft-card info-card">
              <div className="small-label">Steps</div>
              <div className="ai-list" style={{ marginTop: 10 }}>
                {aiSolution.steps.map((item, index) => <p key={`try-step-${index}-${item}`}>{item}</p>)}
              </div>
            </div>
            <div className="soft-card info-card">
              <div className="small-label">Answer</div>
              <p style={{ marginTop: 8 }}>{aiSolution.answer}</p>
            </div>
            {aiSolution.shortcut ? (
              <div className="soft-card info-card">
                <div className="small-label">Shortcut</div>
                <p style={{ marginTop: 8 }}>{aiSolution.shortcut}</p>
              </div>
            ) : null}
            {aiSolution.pitfalls.length ? (
              <div className="review-strip">
                {aiSolution.pitfalls.map((item, index) => <span key={`try-pitfall-${index}-${item}`} className="pill">{item}</span>)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-note" style={{ marginTop: 16 }}>
            Ask for a hint, a full solve, or the fastest method whenever you get stuck.
          </div>
        )}

        <div className="review-strip" style={{ marginTop: 18 }}>
          <span className="pill"><Sparkles size={14} /> zero timer</span>
          <span className="pill"><ChevronRight size={14} /> one-by-one flow</span>
        </div>
      </aside>
    </div>
  );
}
