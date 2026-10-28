import { useState } from "react";
import { Search } from "lucide-react";
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
      <header className="page-header">
        <a href="/" className="logo">
          <span className="logo-icon">
            <Search size={17} aria-hidden="true" />
          </span>
          <span>FoundYou</span>
        </a>

        <button
          type="button"
          className="home-button"
          onClick={handleBackHome}
        >
          Back to home
        </button>
      </header>

      <main className="category-main">
        <span className="step-label">
          STEP 1 OF 3 · NARROW DOWN SEARCH
        </span>

        <h1>Tell us what you lost.</h1>

        <p className="page-description">
          Select a category to help narrow down the visual matching database.
        </p>

        <div className="category-grid" aria-label="Lost item categories">
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
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </span>

                <span className="category-name">{label}</span>

                <span className="category-hint">
                  {isSelected ? "Selected category" : "Click to select"}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="page-footer">
        <button
          type="button"
          className="back-button"
          onClick={handleGoBack}
        >
          Go Back
        </button>

        <button
          type="button"
          className="continue-button"
          onClick={handleContinue}
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
