import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { toggleBookmark } from "@/lib/repository";

const schema = z.object({
  questionId: z.string(),
  topicId: z.string()
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const bookmarked = toggleBookmark(userId, parsed.data.questionId, parsed.data.topicId);
  return NextResponse.json({ bookmarked });
}
