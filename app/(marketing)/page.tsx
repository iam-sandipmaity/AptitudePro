import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { topicCategories } from "@/data/topic-catalog";

const benefits = [
  {
    title: "Try mode",
    copy: "Open a topic and move one question at a time with no timer or setup friction."
  },
  {
    title: "Focused drills",
    copy: "Run short explanation-first rounds when you want structure and quick feedback."
  },
  {
    title: "Clean review",
    copy: "Track weak areas, revisit patterns, and use AI help only when you ask for it."
  }
];

export default async function MarketingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const totalTopics = topicCategories.reduce((sum, category) => sum + category.topics.length, 0);
  const totalQuestions = totalTopics * 220;

  return (
    <main className="marketing-shell minimal-landing">
      <section className="page-shell section minimal-hero-section">
        <div className="minimal-hero-card glass-card">
          <div className="minimal-hero-copy">
            <div className="review-strip">
              <span className="eyebrow">AptitudePro</span>
              <span className="pill"><Sparkles size={14} /> minimal daily prep</span>
            </div>

            <h1 className="minimal-hero-title">Practice aptitude without the usual clutter.</h1>
            <p className="minimal-hero-copytext">
              Move from one-by-one try mode to focused drills and timed mocks in a single clean interface built for daily consistency.
            </p>

            <div className="hero-actions" style={{ marginTop: 24 }}>
              <Link href="/sign-up" className="button-primary">
                Start free practice
                <ArrowRight size={16} />
              </Link>
              <Link href="/sign-in" className="button-secondary">Sign in</Link>
            </div>
          </div>

          <div className="minimal-hero-stats">
            <div className="soft-card minimal-stat-box">
              <div className="small-label">Coverage</div>
              <strong>{totalTopics} topics</strong>
              <span>{totalQuestions.toLocaleString()} generated MCQs</span>
            </div>
            <div className="soft-card minimal-stat-box">
              <div className="small-label">Modes</div>
              <strong>Try, drill, test</strong>
              <span>Start light, add pressure later.</span>
            </div>
            <div className="soft-card minimal-stat-box">
              <div className="small-label">Designed for</div>
              <strong>Calm repetition</strong>
              <span>Fast practice, clear review, optional AI help.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section minimal-benefits-section">
        <div className="page-header minimal-header-row">
          <div>
            <span className="eyebrow">Why It Feels Better</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginTop: 8 }}>Everything important, nothing noisy</h2>
          </div>
          <div className="pill"><CheckCircle2 size={14} /> desktop and mobile ready</div>
        </div>

        <div className="card-grid minimal-benefits-grid">
          {benefits.map((item) => (
            <div key={item.title} className="soft-card topic-card minimal-benefit-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section minimal-library-section">
        <div className="glass-card info-card minimal-library-card">
          <div className="page-header minimal-header-row" style={{ paddingTop: 0 }}>
            <div>
              <span className="eyebrow">Topic Library</span>
              <h2 className="section-title" style={{ fontSize: "2rem", marginTop: 8 }}>Wide coverage, simple entry point</h2>
            </div>
            <div className="pill"><Zap size={14} /> one topic at a time</div>
          </div>

          <div className="minimal-category-list">
            {topicCategories.slice(0, 6).map((category) => (
              <div key={category.id} className="soft-card minimal-category-item">
                <strong>{category.title}</strong>
                <p>{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
