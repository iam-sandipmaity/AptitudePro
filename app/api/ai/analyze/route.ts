import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { allTopics, getTopicById } from "@/data/topic-catalog";
import { requestGroqJson } from "@/lib/groq";
import { getAttempt, getAttemptResponses } from "@/lib/repository";
import { AiAttemptAnalysis, AiPracticeSet, AiProblemSolution, AttemptRecord, AttemptResponseRecord } from "@/lib/types";

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("analyze"),
    attemptId: z.string().min(1)
  }),
  z.object({
    action: z.literal("solve"),
    prompt: z.string().min(5),
    topicId: z.string().optional(),
    attemptId: z.string().optional()
  }),
  z.object({
    action: z.literal("generate"),
    attemptId: z.string().min(1),
    topicId: z.string().optional(),
    count: z.number().int().min(1).max(5).default(3)
  })
]);

const analysisSchema = z.object({
  overview: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1).max(5),
  weaknesses: z.array(z.string().min(1)).min(1).max(5),
  pacing: z.array(z.string().min(1)).min(1).max(5),
  actionPlan: z.array(z.string().min(1)).min(1).max(6),
  recommendedTopics: z.array(z.string().min(1)).min(1).max(6)
});

const solutionSchema = z.object({
  summary: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1).max(8),
  answer: z.string().min(1),
  shortcut: z.string().default(""),
  pitfalls: z.array(z.string().min(1)).max(5).default([])
});

const practiceSetSchema = z.object({
  intro: z.string().min(1),
  questions: z.array(z.object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    difficulty: z.enum(["Easy", "Medium", "Hard"])
  })).min(1).max(5)
});

function createAttemptContext(attempt: AttemptRecord, responses: Record<string, AttemptResponseRecord>) {
  const topicStats = attempt.topicIds.map((topicId) => {
    const questions = attempt.questions.filter((question) => question.topicId === topicId);
    const total = questions.length;
    const correct = questions.filter((question) => responses[question.id]?.isCorrect).length;
    const skipped = questions.filter((question) => responses[question.id]?.skipped).length;
    const marked = questions.filter((question) => responses[question.id]?.markedForReview).length;
    const avgTimeSec = total
      ? Math.round(
          questions.reduce((sum, question) => sum + (responses[question.id]?.timeSpentSec ?? 0), 0) / total
        )
      : 0;

    return {
      topicId,
      title: getTopicById(topicId)?.title ?? topicId,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      correct,
      total,
      skipped,
      marked,
      avgTimeSec
    };
  });

  const missedQuestions = attempt.questions
    .map((question) => {
      const response = responses[question.id];
      return {
        prompt: question.prompt,
        topic: getTopicById(question.topicId)?.title ?? question.topicId,
        selected: response?.selectedIndex === null ? "Skipped" : question.options[response.selectedIndex] ?? "Unknown",
        correct: question.options[question.answerIndex],
        difficulty: question.difficulty,
        timeSpentSec: response?.timeSpentSec ?? 0,
        explanation: question.explanation
      };
    })
    .filter((question) => question.selected === "Skipped" || question.selected !== question.correct)
    .sort((left, right) => right.timeSpentSec - left.timeSpentSec)
    .slice(0, 8);

  return {
    attempt: {
      mode: attempt.mode,
      feedbackMode: attempt.feedbackMode,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      accuracy: Math.round(attempt.accuracy),
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      timeTakenSec: attempt.timeTakenSec
    },
    topics: topicStats,
    missedQuestions,
    availableTopics: allTopics.map((topic) => topic.title)
  };
}

async function loadAttemptContext(userId: string, attemptId: string) {
  const attempt = getAttempt(userId, attemptId);
  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  const responses = getAttemptResponses(userId, attemptId);
  return createAttemptContext(attempt, responses);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI request." }, { status: 400 });
  }

  try {
    if (parsed.data.action === "analyze") {
      const context = await loadAttemptContext(userId, parsed.data.attemptId);
      const analysis = await requestGroqJson<AiAttemptAnalysis>([
        {
          role: "system",
          content: "You are an aptitude exam coach. Return valid JSON only with keys overview, strengths, weaknesses, pacing, actionPlan, recommendedTopics. Keep every point concrete, concise, and useful for a learner."
        },
        {
          role: "user",
          content: `Analyze this completed attempt and give focused coaching.\n${JSON.stringify(context, null, 2)}`
        }
      ]);

      return NextResponse.json({
        action: "analyze",
        analysis: analysisSchema.parse(analysis)
      });
    }

    if (parsed.data.action === "solve") {
      const context = parsed.data.attemptId ? await loadAttemptContext(userId, parsed.data.attemptId) : null;
      const focusTopic = parsed.data.topicId ? getTopicById(parsed.data.topicId)?.title ?? parsed.data.topicId : "General aptitude";
      const solution = await requestGroqJson<AiProblemSolution>([
        {
          role: "system",
          content: "You are an aptitude and interview-prep problem solver. Return valid JSON only with keys summary, steps, answer, shortcut, pitfalls. Explain clearly and keep steps easy to follow."
        },
        {
          role: "user",
          content: `Solve the following problem for a learner.\nFocus topic: ${focusTopic}\nLearner context: ${context ? JSON.stringify(context.topics.slice(0, 4), null, 2) : "No prior attempt context provided."}\nProblem:\n${parsed.data.prompt}`
        }
      ]);

      return NextResponse.json({
        action: "solve",
        solution: solutionSchema.parse(solution)
      });
    }

    const context = await loadAttemptContext(userId, parsed.data.attemptId);
    const focusTopicTitle = parsed.data.topicId ? getTopicById(parsed.data.topicId)?.title ?? parsed.data.topicId : "weak areas from the attempt";
    const practiceSet = await requestGroqJson<AiPracticeSet>([
      {
        role: "system",
        content: "You create original aptitude practice questions. Return valid JSON only with keys intro and questions. Each question must include prompt, options, answerIndex, explanation, difficulty. Provide exactly 4 options per question and make only one option correct."
      },
      {
        role: "user",
        content: `Generate ${parsed.data.count} follow-up MCQ practice questions based on this learner's performance.\nFocus topic: ${focusTopicTitle}\nAttempt context:\n${JSON.stringify(context, null, 2)}\nMake the questions fresh, exam-style, and tuned to the learner's weak spots.`
      }
    ], 2200);

    return NextResponse.json({
      action: "generate",
      practiceSet: practiceSetSchema.parse(practiceSet)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
