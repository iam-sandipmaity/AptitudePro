export type AttemptMode = "practice" | "test" | "daily";
export type FeedbackMode = "instant" | "end";

export type TopicFamily =
  | "quant"
  | "data-interpretation"
  | "reasoning"
  | "verbal"
  | "awareness"
  | "science"
  | "interview"
  | "engineering"
  | "programming"
  | "technical"
  | "medical"
  | "puzzle";

export type Topic = {
  id: string;
  title: string;
  categoryId: string;
  family: TopicFamily;
  description: string;
  tagline: string;
  questionCount: number;
};

export type TopicCategory = {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
};

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export type QuestionMedia = {
  kind: "image";
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export type Question = {
  id: string;
  topicId: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  media?: QuestionMedia;
};

export type AttemptQuestion = Question & {
  bookmarked?: boolean;
};

export type AttemptResponseInput = {
  questionId: string;
  topicId: string;
  selectedIndex: number | null;
  markedForReview: boolean;
  skipped: boolean;
  timeSpentSec: number;
};

export type AttemptResponseRecord = {
  selectedIndex: number | null;
  isCorrect: boolean;
  markedForReview: boolean;
  skipped: boolean;
  timeSpentSec: number;
};

export type AttemptRecord = {
  id: string;
  userId: string;
  mode: AttemptMode;
  feedbackMode: FeedbackMode;
  topicIds: string[];
  totalQuestions: number;
  timeLimitSec: number | null;
  questions: AttemptQuestion[];
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt: string | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  timeTakenSec: number;
};

export type DashboardStats = {
  currentStreak: number;
  bestStreak: number;
  totalTestsTaken: number;
  accuracy: number;
  averageTimePerTest: number;
  totalQuestionsAnswered: number;
};

export type HeatmapDay = {
  date: string;
  count: number;
};

export type TopicPerformance = {
  topicId: string;
  topicTitle: string;
  attempts: number;
  accuracy: number;
  correct: number;
  total: number;
};

export type AttemptSummary = {
  id: string;
  mode: AttemptMode;
  topicLabel: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  timeTakenSec: number;
  completedAt: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  totalTests: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalTimeSec: number;
};

export type AiAttemptAnalysis = {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  pacing: string[];
  actionPlan: string[];
  recommendedTopics: string[];
};

export type AiProblemSolution = {
  summary: string;
  steps: string[];
  answer: string;
  shortcut: string;
  pitfalls: string[];
};

export type AiPracticeQuestion = {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: QuestionDifficulty;
};

export type AiPracticeSet = {
  intro: string;
  questions: AiPracticeQuestion[];
};
