import { TestBuilder } from "@/components/test/test-builder";
import { topicCategories } from "@/data/topic-catalog";

export default function TestCreatePage() {
  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Test Mode</span>
          <h1 className="section-title" style={{ fontSize: "2.4rem", marginTop: 10 }}>Build a premium mock in seconds</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>Blend topics, set the timer, and simulate exam pressure with navigation, review markers, and full explanations.</p>
        </div>
        <div className="pill">Custom timed simulation</div>
      </div>
      <TestBuilder categories={topicCategories} />
    </main>
  );
}
