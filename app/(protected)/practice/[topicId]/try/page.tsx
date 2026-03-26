import { notFound } from "next/navigation";
import { PracticeTryMode } from "@/components/practice/practice-try-mode";
import { getTopicById } from "@/data/topic-catalog";

export default async function PracticeTryModePage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Try Mode</span>
          <h1 className="section-title" style={{ fontSize: "2.4rem", marginTop: 10 }}>{topic.title} one-by-one practice</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>
            Drop straight into a flowing question stream with no timer and no question-count setup. Use AI only when you want help.
          </p>
        </div>
        <div className="review-strip">
          <span className="pill">{topic.tagline}</span>
          <span className="pill">Optional Groq helper</span>
        </div>
      </div>

      <PracticeTryMode topic={topic} />
    </main>
  );
}
