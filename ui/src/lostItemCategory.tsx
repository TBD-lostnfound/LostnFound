import { useState } from "react";
import { ArrowRight, Check, Search } from "lucide-react";
import { categories } from "./categories";
import "./lostItemCategory.css";



export default function LostItemCategory() {
  const [selectedCategory, setSelectedCategory] = useState("bookbag");

  const handleBackHome = () => {
    window.location.assign("/");
  };

  const handleGoBack = () => {
    window.location.assign("/");
  };

  const handleContinue = () => {
    window.location.assign(
      `/lost/agent?category=${encodeURIComponent(selectedCategory)}`
    );
  };

  return (
    <div className="category-page">
      <header className="fy-header">
        <div className="fy-header-inner">
          <a href="/" className="fy-logo">
            <span className="fy-logo-icon">
              <Search size={19} strokeWidth={2.4} aria-hidden="true" />
            </span>
            FoundYou
          </a>

          <ol className="fy-progress" aria-label="Step 1 of 3">
            <li className="done" />
            <li />
            <li />
          </ol>

          <button
            type="button"
            className="fy-back-link"
            onClick={handleBackHome}
          >
            Back to home
          </button>
        </div>
      </header>

      <main className="category-main">
        <span className="step-label fy-rise">
          STEP 1 OF 3 · NARROW DOWN SEARCH
        </span>

        <h1 className="fy-rise fy-delay-1">
          Tell us what you <span className="fy-highlight">lost.</span>
        </h1>

        <p className="page-description fy-rise fy-delay-2">
          Pick a category so the agent only searches the right kind of item.
        </p>

        <div
          className="category-grid fy-rise fy-delay-3"
          aria-label="Lost item categories"
        >
          {categories.map(({ id, label, icon: Icon }) => {
            const isSelected = selectedCategory === id;

            return (
              <button
                key={id}
                type="button"
                className={`category-card ${isSelected ? "selected" : ""}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(id)}
              >
                <span className="category-icon">
                  <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                </span>

                <span className="category-name">{label}</span>

                <span className="category-hint">
                  {isSelected ? (
                    <>
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                      Selected
                    </>
                  ) : (
                    "Click to select"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="page-footer">
        <div className="page-footer-inner">
          <button
            type="button"
            className="fy-btn fy-btn-secondary"
            onClick={handleGoBack}
          >
            Go Back
          </button>

          <button
            type="button"
            className="fy-btn fy-btn-primary"
            onClick={handleContinue}
          >
            Continue
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
