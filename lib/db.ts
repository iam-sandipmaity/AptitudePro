import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

declare global {
  var __aptitudeDb: Database.Database | undefined;
}

function initialize(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      total_tests INTEGER NOT NULL DEFAULT 0,
      total_questions_answered INTEGER NOT NULL DEFAULT 0,
      total_correct INTEGER NOT NULL DEFAULT 0,
      total_time_sec INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      feedback_mode TEXT NOT NULL,
      topic_ids TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      time_limit_sec INTEGER,
      question_payload TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      accuracy REAL NOT NULL DEFAULT 0,
      time_taken_sec INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      selected_index INTEGER,
      is_correct INTEGER NOT NULL,
      marked_for_review INTEGER NOT NULL,
      skipped INTEGER NOT NULL,
      time_spent_sec INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS daily_activity (
      user_id TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      questions_answered INTEGER NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, activity_date)
    );
  `);
}

export function getDb() {
  if (!global.__aptitudeDb) {
    const dataDir = path.join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, "aptitude-pro.db");
    global.__aptitudeDb = new Database(dbPath);
    initialize(global.__aptitudeDb);
  }

  return global.__aptitudeDb;
}
