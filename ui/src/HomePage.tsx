import { Search, CircleCheck, Clock3, ShieldCheck } from "lucide-react";

// Design-only page. Connect these handlers when the related flows are ready.
// const handleAbout = () => {};
// const handleUpdates = () => {};
// const handleSignIn = () => {};


export default function Home() {
  const handleReportLostItem = () => {
    window.location.assign("/lost/category");
  };

  return (
    <main>
      <section className="dark-section">
        <header className="header">
          <div className="brand"><span className="brand-icon"><Search size={28} strokeWidth={2} /></span><span>FoundYou</span></div>
          <nav aria-label="Main navigation">
            <button type="button" className="nav-button" aria-disabled="true"
              // onClick={handleAbout}
            >About</button>
            <button type="button" className="nav-button" aria-disabled="true"
              // onClick={handleUpdates}
            >Updates</button>
            <button type="button" className="sign-in" aria-disabled="true"
              // onClick={handleSignIn}
            >Sign In</button>
          </nav>
        </header>
        <div className="hero">
          <span className="eyebrow">SECURE CAMPUS MATCHING</span>
          <h1>Find what you lost.<br />Return what you found.</h1>
          <p className="intro">Upload a photo or describe your item — we&apos;ll scan campus reports<br className="desktop-break" /> instantly and guide you the rest of the way.</p>
          <div className="report-actions">
            <button type="button" className="report-button lost"
              onClick={handleReportLostItem}
            ><Search size={34} aria-hidden="true" />I Lost Something</button>
            <button type="button" className="report-button found"
              onClick={() => window.location.assign("/found/report")}
            ><ShieldCheck size={36} aria-hidden="true" />I Found Something</button>
          </div>
          <p className="trust-line">Powered by visual matching · Secure Campus Network</p>
        </div>
      </section>
      {/* Display-only statistics reproduced from the supplied design. */}
      <section className="stats" aria-label="FoundYou at a glance">
        <div className="stats-inner">
          <div className="stat"><span className="stat-icon"><CircleCheck size={32} strokeWidth={1.6} /></span><div><strong>128</strong><p>items reunited this term</p></div></div>
          <div className="stat"><span className="stat-icon"><Clock3 size={32} strokeWidth={1.6} /></span><div><strong>&lt;2 min</strong><p>to report an item</p></div></div>
          <div className="stat"><span className="stat-icon"><ShieldCheck size={32} strokeWidth={1.6} /></span><div><strong>Verified</strong><p>before every return</p></div></div>
        </div>
      </section>
    </main>
  );
}
