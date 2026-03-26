import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { getTopicById } from "@/data/topic-catalog";
import { getNextPracticeQuestion } from "@/lib/question-bank";
import { syncUserProfile } from "@/lib/repository";

const schema = z.object({
  topicId: z.string().min(1),
  seenQuestionIds: z.array(z.string()).max(220).default([])
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

  const topic = getTopicById(parsed.data.topicId);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const result = getNextPracticeQuestion(parsed.data.topicId, parsed.data.seenQuestionIds);
  if (!result) {
    return NextResponse.json({ error: "No question available" }, { status: 404 });
  }

  return NextResponse.json(result);
}
