import { notFound } from "next/navigation";
import { PracticeConfigurator } from "@/components/practice/practice-configurator";
import { getTopicById } from "@/data/topic-catalog";

export default async function PracticeTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">{topic.categoryId.replace(/-/g, " ")}</span>
          <h1 className="section-title" style={{ fontSize: "2.4rem", marginTop: 10 }}>{topic.title}</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>{topic.description}</p>
        </div>
        <div className="review-strip">
          <span className="pill">{topic.questionCount} MCQs</span>
          <span className="pill">{topic.tagline}</span>
        </div>
      </div>

      <div className="two-column topic-page-layout">
        <PracticeConfigurator topic={topic} />
        <div className="glass-card info-card">
          <div className="small-label">What changes here</div>
          <h3 style={{ marginTop: 8 }}>Train the way you want today</h3>
          <div className="solution-list" style={{ marginTop: 18 }}>
            <div className="soft-card topic-card"><strong>Focused drill</strong><p>Set a short explanation-first round when you want a compact, trackable practice session.</p></div>
            <div className="soft-card topic-card"><strong>Try mode</strong><p>Drop into a one-by-one stream with no timer and no count selection when you just want momentum.</p></div>
            <div className="soft-card topic-card"><strong>AI help on demand</strong><p>Use the Groq assistant only when a question blocks you and you want a clearer explanation or shortcut.</p></div>
          </div>
        </div>
      </div>
    </main>
  );
}
