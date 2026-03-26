import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAttempt, syncUserProfile } from "@/lib/repository";

const schema = z.object({
  mode: z.enum(["practice", "test", "daily"]),
  feedbackMode: z.enum(["instant", "end"]),
  topicIds: z.array(z.string()).min(1),
  totalQuestions: z.number().min(1).max(50),
  timeLimitSec: z.number().nullable()
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    syncUserProfile({
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
      name: clerkUser.fullName ?? clerkUser.firstName ?? "Learner",
      avatarUrl: clerkUser.imageUrl
    });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const attempt = createAttempt({ userId, ...parsed.data });
  return NextResponse.json({ attemptId: attempt.id });
}
