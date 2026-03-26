import { notFound } from "next/navigation";
import { ResultsView } from "@/components/test/results-view";
import { requireAppUser } from "@/lib/auth";
import { getAttempt, getAttemptResponses } from "@/lib/repository";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireAppUser();
  const { attemptId } = await params;
  const attempt = getAttempt(user.id, attemptId);

  if (!attempt || attempt.status !== "completed") {
    notFound();
  }

  const responses = getAttemptResponses(user.id, attemptId);
  return <ResultsView attempt={attempt} responses={responses} />;
}
