import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { topicCategories } from "@/data/topic-catalog";

export function CategoryBrowser() {
  return (
    <div className="topic-browser">
      {topicCategories.map((category, index) => (
        <details key={category.id} className="soft-card topic-group" open={index < 2}>
          <summary>
            <span>
              {category.title}
              <span className="muted" style={{ marginLeft: 10 }}>{category.topics.length} topics</span>
            </span>
            <ChevronRight size={16} />
          </summary>

          <div className="topic-list">
            {category.topics.map((topic) => (
              <Link key={topic.id} href={`/practice/${topic.id}`} className="soft-card topic-card">
                <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{topic.title}</h3>
                  <span className="pill">{topic.questionCount} MCQs</span>
                </div>
                <p>{topic.description}</p>
                <div className="review-strip">
                  <span className="pill">{topic.tagline}</span>
                  <span className="pill">Exam-style</span>
                </div>
              </Link>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
