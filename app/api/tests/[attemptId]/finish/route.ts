import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { finishAttempt } from "@/lib/repository";

const schema = z.object({
  responses: z.array(z.object({
    questionId: z.string(),
    topicId: z.string(),
    selectedIndex: z.number().nullable(),
    markedForReview: z.boolean(),
    skipped: z.boolean(),
    timeSpentSec: z.number()
  })),
  timeTakenSec: z.number().min(0)
});

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const attempt = finishAttempt(userId, attemptId, parsed.data.responses, parsed.data.timeTakenSec);
  return NextResponse.json({ attemptId: attempt.id, status: attempt.status });
}
