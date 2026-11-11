import {
  ArrowDown,
  ArrowRight,
  Camera,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./HomePage.css";

// Design-only nav items. Connect these handlers when the related pages are ready.
// const handleAbout = () => {};
// const handleUpdates = () => {};
// const handleSignIn = () => {};

type Step = { icon: LucideIcon; title: string; text: string };

const lostSteps: Step[] = [
  { icon: LayoutGrid, title: "Pick a category", text: "Bookbag, laptop, keys and more. It narrows the search to the right kind of item." },
  { icon: MessageCircle, title: "Describe it to the agent", text: "Tell the FoundYou Agent the color, any unique details, and where you last had it." },
  { icon: ShieldCheck, title: "Check matches and verify", text: "Review possible matches, confirm it’s yours, and arrange the return without sharing contact details." },
];

const foundSteps: Step[] = [
  { icon: Camera, title: "Snap a photo", text: "Take a picture of the item or upload one. We help identify what it is." },
  { icon: MapPin, title: "Add where and when", text: "Pick what it is and its color, then say where and when you found it." },
  { icon: UserCheck, title: "The owner finds it", text: "When the owner searches, your report shows up as a match. Your photo is only shown to a verified match." },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="home-steps">
      {steps.map(({ icon: Icon, title, text }, index) => (
        <li key={title}>
          <span className="home-step-icon"><Icon size={24} strokeWidth={2} aria-hidden="true" /></span>
          <div>
            <span className="home-step-number">Step {index + 1}</span>
            <h4>{title}</h4>
            <p>{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  const handleReportLostItem = () => {
    window.location.assign("/lost/category");
  };

  const handleReportFoundItem = () => {
    window.location.assign("/found/report");
  };

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-glow home-glow-right" aria-hidden="true" />
        <div className="home-glow home-glow-left" aria-hidden="true" />

        <header className="home-header">
          <a href="/" className="fy-logo">
            <span className="fy-logo-icon"><Search size={20} strokeWidth={2.4} aria-hidden="true" /></span>
            FoundYou
          </a>
          <nav aria-label="Main navigation">
            <a href="#how-it-works" className="home-nav-link">How it works</a>
            <button type="button" className="home-nav-link" aria-disabled="true"
              // onClick={handleAbout}
            >About</button>
            <button type="button" className="home-nav-link" aria-disabled="true"
              // onClick={handleUpdates}
            >Updates</button>
            <button type="button" className="home-sign-in" aria-disabled="true"
              // onClick={handleSignIn}
            >Sign In</button>
          </nav>
        </header>

        <div className="home-hero-content">
          <span className="home-eyebrow fy-rise">SECURE CAMPUS MATCHING</span>
          <h1 className="fy-rise fy-delay-1">Find what you lost.<br />Return what <span className="fy-highlight">you found.</span></h1>
          <p className="home-intro fy-rise fy-delay-2">Upload a photo or describe your item. We&apos;ll scan campus reports instantly and guide you the rest of the way.</p>
          <div className="home-actions fy-rise fy-delay-3">
            <button type="button" className="fy-btn fy-btn-primary home-report-button" onClick={handleReportLostItem}>
              <Search size={24} strokeWidth={2.2} aria-hidden="true" />I Lost Something
            </button>
            <button type="button" className="fy-btn fy-btn-secondary home-report-button" onClick={handleReportFoundItem}>
              <ShieldCheck size={24} strokeWidth={2} aria-hidden="true" />I Found Something
            </button>
          </div>
          <a href="#how-it-works" className="home-scroll-cue fy-rise fy-delay-4">
            See how it works
            <span className="home-scroll-arrow"><ArrowDown size={20} strokeWidth={2.4} aria-hidden="true" /></span>
          </a>
        </div>
      </section>

      <section id="how-it-works" className="home-how" aria-labelledby="how-it-works-title">
        <div className="home-how-inner">
          <div className="home-how-heading home-reveal">
            <p className="home-kicker">HOW IT WORKS</p>
            <h2 id="how-it-works-title">Two ways in, one goal: getting things back to their owners.</h2>
            <p>Whether you lost something or found something, it takes three steps.</p>
          </div>

          <div className="home-flows">
            <article className="home-flow home-reveal">
              <span className="home-flow-tag">I lost something</span>
              <h3>Find your item</h3>
              <StepList steps={lostSteps} />
              <button type="button" className="fy-btn fy-btn-primary home-flow-button" onClick={handleReportLostItem}>
                Report a lost item <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </article>

            <article className="home-flow dark home-reveal">
              <span className="home-flow-tag">I found something</span>
              <h3>Return an item</h3>
              <StepList steps={foundSteps} />
              <button type="button" className="fy-btn fy-btn-primary home-flow-button" onClick={handleReportFoundItem}>
                Report a found item <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <span>FoundYou · Campus lost and found</span>
        <span>Only shown to a verified match — never posted publicly.</span>
      </footer>
    </main>
  );
}
