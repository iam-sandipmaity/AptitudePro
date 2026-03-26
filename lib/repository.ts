import { getQuestionCountForTopic, pickQuestionsForTopics } from "@/lib/question-bank";
import { getDb } from "@/lib/db";
import { allTopics, getTopicById } from "@/data/topic-catalog";
import { AppUser, AttemptQuestion, AttemptRecord, AttemptResponseInput, AttemptResponseRecord, AttemptSummary, DashboardStats, FeedbackMode, HeatmapDay, TopicPerformance } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dateKeyFromOffset(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return dateKey(date);
}

function mapUser(row: any): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    lastActiveDate: row.last_active_date,
    totalTests: row.total_tests,
    totalQuestionsAnswered: row.total_questions_answered,
    totalCorrect: row.total_correct,
    totalTimeSec: row.total_time_sec
  };
}

function mapAttempt(row: any, bookmarkedIds = new Set<string>()): AttemptRecord {
  const questions = JSON.parse(row.question_payload) as AttemptQuestion[];
  return {
    id: row.id,
    userId: row.user_id,
    mode: row.mode,
    feedbackMode: row.feedback_mode,
    topicIds: JSON.parse(row.topic_ids),
    totalQuestions: row.total_questions,
    timeLimitSec: row.time_limit_sec,
    questions: questions.map((question) => ({ ...question, bookmarked: bookmarkedIds.has(question.id) })),
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    accuracy: row.accuracy,
    timeTakenSec: row.time_taken_sec
  };
}

export function syncUserProfile(input: { id: string; email: string; name: string; avatarUrl: string }) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(input.id) as any;
  const timestamp = nowIso();

  if (!existing) {
    db.prepare(`
      INSERT INTO users (
        id, email, name, avatar_url, current_streak, best_streak, last_active_date,
        total_tests, total_questions_answered, total_correct, total_time_sec, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, 0, NULL, 0, 0, 0, 0, ?, ?)
    `).run(input.id, input.email, input.name, input.avatarUrl, timestamp, timestamp);
  } else {
    db.prepare("UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?").run(input.email, input.name, input.avatarUrl, timestamp, input.id);
  }

  return getUser(input.id)!;
}

export function getUser(userId: string) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  return row ? mapUser(row) : null;
}

export function getDashboardStats(userId: string): DashboardStats {
  const user = getUser(userId);
  if (!user) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalTestsTaken: 0,
      accuracy: 0,
      averageTimePerTest: 0,
      totalQuestionsAnswered: 0
    };
  }

  return {
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    totalTestsTaken: user.totalTests,
    accuracy: user.totalQuestionsAnswered ? (user.totalCorrect / user.totalQuestionsAnswered) * 100 : 0,
    averageTimePerTest: user.totalTests ? Math.round(user.totalTimeSec / user.totalTests) : 0,
    totalQuestionsAnswered: user.totalQuestionsAnswered
  };
}

export function getRecentAttempts(userId: string, limit = 6): AttemptSummary[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM attempts WHERE user_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT ?").all(userId, limit) as any[];
  return rows.map((row) => {
    const topicIds = JSON.parse(row.topic_ids) as string[];
    const titles = topicIds.map((topicId) => getTopicById(topicId)?.title ?? topicId);
    return {
      id: row.id,
      mode: row.mode,
      topicLabel: titles.length > 2 ? `${titles.slice(0, 2).join(", ")} +${titles.length - 2}` : titles.join(", "),
      score: row.score,
      accuracy: row.accuracy,
      totalQuestions: row.total_questions,
      timeTakenSec: row.time_taken_sec,
      completedAt: row.completed_at
    };
  });
}

export function getHeatmap(userId: string, days = 84): HeatmapDay[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM daily_activity WHERE user_id = ?").all(userId) as any[];
  const byDate = new Map(rows.map((row) => [row.activity_date, row.attempts_count]));
  return Array.from({ length: days }, (_, idx) => {
    const offset = idx - (days - 1);
    const date = dateKeyFromOffset(offset);
    return {
      date,
      count: byDate.get(date) ?? 0
    };
  });
}

export function getTopicPerformance(userId: string): TopicPerformance[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT topic_id, COUNT(*) as total, SUM(is_correct) as correct, COUNT(DISTINCT attempt_id) as attempts
    FROM responses
    WHERE user_id = ?
    GROUP BY topic_id
    ORDER BY correct * 1.0 / COUNT(*) DESC
  `).all(userId) as any[];

  return rows.map((row) => {
    const topic = getTopicById(row.topic_id);
    const total = Number(row.total ?? 0);
    const correct = Number(row.correct ?? 0);
    return {
      topicId: row.topic_id,
      topicTitle: topic?.title ?? row.topic_id,
      attempts: Number(row.attempts ?? 0),
      accuracy: total ? (correct / total) * 100 : 0,
      correct,
      total
    };
  });
}

export function getBookmarks(userId: string) {
  const db = getDb();
  const rows = db.prepare("SELECT question_id FROM bookmarks WHERE user_id = ?").all(userId) as Array<{ question_id: string }>;
  return new Set(rows.map((row) => row.question_id));
}

export function createAttempt(input: {
  userId: string;
  mode: AttemptRecord["mode"];
  feedbackMode: FeedbackMode;
  topicIds: string[];
  totalQuestions: number;
  timeLimitSec: number | null;
}) {
  const db = getDb();
  const topicIds = [...new Set(input.topicIds)];
  const attemptId = crypto.randomUUID();
  const questions = pickQuestionsForTopics(topicIds, input.totalQuestions, attemptId);
  const bookmarkedIds = getBookmarks(input.userId);
  const payload = questions.map((question) => ({ ...question, bookmarked: bookmarkedIds.has(question.id) }));
  const startedAt = nowIso();

  db.prepare(`
    INSERT INTO attempts (
      id, user_id, mode, feedback_mode, topic_ids, total_questions, time_limit_sec,
      question_payload, status, started_at, completed_at, score, correct_count, wrong_count, accuracy, time_taken_sec
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, NULL, 0, 0, 0, 0, 0)
  `).run(
    attemptId,
    input.userId,
    input.mode,
    input.feedbackMode,
    JSON.stringify(topicIds),
    questions.length,
    input.timeLimitSec,
    JSON.stringify(payload),
    startedAt
  );

  return getAttempt(input.userId, attemptId)!;
}

export function getAttempt(userId: string, attemptId: string) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM attempts WHERE id = ? AND user_id = ?").get(attemptId, userId) as any;
  if (!row) return null;
  return mapAttempt(row, getBookmarks(userId));
}

export function finishAttempt(userId: string, attemptId: string, responses: AttemptResponseInput[], timeTakenSec: number) {
  const db = getDb();
  const attempt = getAttempt(userId, attemptId);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status === "completed") {
    return attempt;
  }

  const responseByQuestionId = new Map(responses.map((response) => [response.questionId, response]));
  const answered = attempt.questions.map((question) => {
    const response = responseByQuestionId.get(question.id) ?? {
      questionId: question.id,
      topicId: question.topicId,
      selectedIndex: null,
      markedForReview: false,
      skipped: true,
      timeSpentSec: 0
    };
    const isCorrect = response.selectedIndex === question.answerIndex;
    return { question, response, isCorrect };
  });

  const correctCount = answered.filter((item) => item.isCorrect).length;
  const wrongCount = attempt.questions.length - correctCount;
  const accuracy = attempt.questions.length ? (correctCount / attempt.questions.length) * 100 : 0;
  const completedAt = nowIso();
  const today = dateKey();
  const yesterday = dateKeyFromOffset(-1);

  const transaction = db.transaction(() => {
    answered.forEach(({ question, response, isCorrect }) => {
      db.prepare(`
        INSERT INTO responses (
          id, attempt_id, user_id, question_id, topic_id, selected_index,
          is_correct, marked_for_review, skipped, time_spent_sec, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        attemptId,
        userId,
        question.id,
        question.topicId,
        response.selectedIndex,
        isCorrect ? 1 : 0,
        response.markedForReview ? 1 : 0,
        response.skipped ? 1 : 0,
        response.timeSpentSec,
        completedAt
      );
    });

    db.prepare(`
      UPDATE attempts
      SET status = 'completed', completed_at = ?, score = ?, correct_count = ?, wrong_count = ?, accuracy = ?, time_taken_sec = ?
      WHERE id = ? AND user_id = ?
    `).run(completedAt, correctCount, correctCount, wrongCount, accuracy, timeTakenSec, attemptId, userId);

    const user = getUser(userId);
    if (user) {
      const currentStreak = !user.lastActiveDate
        ? 1
        : user.lastActiveDate === today
          ? user.currentStreak
          : user.lastActiveDate === yesterday
            ? user.currentStreak + 1
            : 1;
      const bestStreak = Math.max(user.bestStreak, currentStreak);
      db.prepare(`
        UPDATE users
        SET current_streak = ?, best_streak = ?, last_active_date = ?, total_tests = total_tests + 1,
            total_questions_answered = total_questions_answered + ?, total_correct = total_correct + ?,
            total_time_sec = total_time_sec + ?, updated_at = ?
        WHERE id = ?
      `).run(currentStreak, bestStreak, today, attempt.questions.length, correctCount, timeTakenSec, completedAt, userId);
    }

    db.prepare(`
      INSERT INTO daily_activity (user_id, activity_date, attempts_count, questions_answered, correct_answers)
      VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(user_id, activity_date)
      DO UPDATE SET
        attempts_count = attempts_count + 1,
        questions_answered = questions_answered + excluded.questions_answered,
        correct_answers = correct_answers + excluded.correct_answers
    `).run(userId, today, attempt.questions.length, correctCount);
  });

  transaction();
  return getAttempt(userId, attemptId)!;
}

export function toggleBookmark(userId: string, questionId: string, topicId: string) {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM bookmarks WHERE user_id = ? AND question_id = ?").get(userId, questionId) as any;
  if (existing) {
    db.prepare("DELETE FROM bookmarks WHERE id = ?").run(existing.id);
    return false;
  }

  db.prepare("INSERT INTO bookmarks (id, user_id, question_id, topic_id, created_at) VALUES (?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    userId,
    questionId,
    topicId,
    nowIso()
  );
  return true;
}

export function getDashboardPayload(userId: string) {
  const stats = getDashboardStats(userId);
  const recentAttempts = getRecentAttempts(userId);
  const performance = getTopicPerformance(userId);
  const strongAreas = [...performance].slice(0, 4);
  const weakAreas = [...performance].sort((a, b) => a.accuracy - b.accuracy).slice(0, 4);

  return {
    stats,
    recentAttempts,
    heatmap: getHeatmap(userId),
    performance,
    strongAreas,
    weakAreas,
    categories: allTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      questionCount: getQuestionCountForTopic(topic.id),
      tagline: topic.tagline,
      categoryId: topic.categoryId
    }))
  };
}

export function getAttemptResponses(userId: string, attemptId: string) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM responses WHERE user_id = ? AND attempt_id = ?").all(userId, attemptId) as any[];
  return Object.fromEntries(
    rows.map((row) => [
      row.question_id,
      {
        selectedIndex: row.selected_index,
        isCorrect: Boolean(row.is_correct),
        markedForReview: Boolean(row.marked_for_review),
        skipped: Boolean(row.skipped),
        timeSpentSec: row.time_spent_sec
      }
    ])
  ) as Record<string, AttemptResponseRecord>;
}


