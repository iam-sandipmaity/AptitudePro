import { CategoryBrowser } from "@/components/ui/category-browser";

export default function PracticePage() {
  return (
    <main className="page-shell section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Practice</span>
          <h1 className="section-title" style={{ fontSize: "2.4rem", marginTop: 10 }}>Pick a topic, then choose your pace</h1>
          <p className="section-copy" style={{ marginTop: 12 }}>
            Each topic now supports both focused drill setup and a frictionless try mode with one-by-one questions and optional AI help.
          </p>
        </div>
        <div className="review-strip">
          <span className="pill">Focused drills</span>
          <span className="pill">Try mode</span>
        </div>
      </div>
      <CategoryBrowser />
    </main>
  );
}
