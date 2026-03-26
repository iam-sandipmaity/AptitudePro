import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/test/exam-runner";
import { requireAppUser } from "@/lib/auth";
import { getAttempt } from "@/lib/repository";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireAppUser();
  const { attemptId } = await params;
  const attempt = getAttempt(user.id, attemptId);

  if (!attempt) {
    notFound();
  }

  return <ExamRunner attempt={attempt} />;
}
