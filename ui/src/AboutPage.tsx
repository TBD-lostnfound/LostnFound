import { ArrowRight, Camera, Check, Clock3, Leaf, Lock, MapPin, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SiteHeader from "./SiteHeader";
import "./AboutPage.css";

// Connect this when the team picks a feedback email address or form.
// const handleSendFeedback = () => {};

type Card = { icon: LucideIcon; title: string; text: string };

const problems: Card[] = [
  { icon: MapPin, title: "It's scattered", text: "Lost items end up at different front desks, in group chats and on social media. Owners don't know where to look, and finders don't know where to turn things in." },
  { icon: Clock3, title: "It's slow and stressful", text: "Losing an ID, keys or a laptop means hours of searching and asking around, often right when you need it most." },
];

const differences: Card[] = [
  { icon: MessageCircle, title: "An agent instead of a board", text: "Describe your item in your own words. The FoundYou Agent asks a few questions and searches every campus report for you." },
  { icon: Camera, title: "Photo matching for finders", text: "Finders snap a photo and add where they found it. The app identifies the item, so reporting takes a couple of minutes." },
  { icon: Lock, title: "Private by design", text: "Nothing goes on a public board. Photos and details are only shown to someone who verifies a match." },
];

const safeguards = [
  { title: "Nothing is posted publicly.", text: "Reports are only searched by the agent." },
  { title: "Photos are only shown to a verified match,", text: "never to people browsing." },
  { title: "Owners confirm details only they would know", text: "before a return is arranged." },
];

// Placeholders until the team has real campus figures.
const wasteStats = [
  { value: "[X]%", label: "of items turned in on campus are never claimed" },
  { value: "[X]", label: "items sent to donation or landfill each term" },
];

export default function AboutPage() {
  return (
    <main className="about">
      <section className="about-hero">
        <div className="about-glow" aria-hidden="true" />
        <SiteHeader current="about" />
        <div className="about-hero-content">
          <span className="about-eyebrow fy-rise">ABOUT FOUNDYOU</span>
          <h1 className="fy-rise fy-delay-1">Every item returned is <span className="fy-highlight">one less thrown away.</span></h1>
          <p className="fy-rise fy-delay-2">FoundYou is a campus lost and found that uses an AI agent and photo matching to get things back to their owners, quickly and privately.</p>
        </div>
      </section>

      <section className="about-band">
        <div className="about-inner">
          <div className="about-heading about-reveal">
            <p className="about-kicker">THE PROBLEM</p>
            <h2>Lost and found on campus is scattered, and a lot of it ends up as waste.</h2>
          </div>

          <div className="about-grid">
            {problems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="about-card soft about-reveal">
                <span className="about-icon solid"><Icon size={24} strokeWidth={2} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="about-waste about-reveal">
            <div className="about-waste-text">
              <span className="about-waste-tag"><Leaf size={15} strokeWidth={2.2} aria-hidden="true" />Sustainability</span>
              <h3>It's wasteful</h3>
              <p>Items that never find their owner are often donated or thrown away, and their owners buy replacements. Water bottles, chargers, headphones and laptops all take materials and energy to make and ship, and lost electronics add to e-waste.</p>
              <p className="about-waste-point">Getting an item back keeps it in use. It's the simplest way to reuse instead of replace.</p>
            </div>
            <div className="about-waste-stats">
              {wasteStats.map(({ value, label }) => (
                <div key={label} className="about-stat">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
              <p className="about-stat-note">Placeholders: replace with real figures from campus lost and found or your survey.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-inner about-different">
        <div className="about-heading center about-reveal">
          <p className="about-kicker">WHAT MAKES FOUNDYOU DIFFERENT</p>
          <h2>One place to report, search and return.</h2>
        </div>
        <div className="about-grid three">
          {differences.map(({ icon: Icon, title, text }) => (
            <div key={title} className="about-card about-reveal">
              <span className="about-icon"><Icon size={24} strokeWidth={2} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-band bordered">
        <div className="about-inner about-trust">
          <div className="about-trust-intro about-reveal">
            <p className="about-kicker">TRUST AND SAFETY</p>
            <h2>Your item goes back to you, not just anyone.</h2>
            <p>FoundYou helps you compare possible matches. It does not decide who owns an item: the owner proves it.</p>
          </div>
          <ul className="about-safeguards about-reveal">
            {safeguards.map(({ title, text }) => (
              <li key={title}>
                <span className="about-check"><Check size={15} strokeWidth={3} aria-hidden="true" /></span>
                <span><strong>{title}</strong> {text}</span>
              </li>
            ))}
            <li className="placeholder">
              <span className="about-check">?</span>
              <span><strong>After an item is returned:</strong> [say how long reports and photos are kept, and when they're deleted].</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="about-inner">
        <div className="about-feedback about-reveal">
          <div>
            <h2>Help us make FoundYou better</h2>
            <p>Found a bug, or have an idea for a feature? We read every message.</p>
          </div>
          <button type="button" className="fy-btn about-feedback-button" aria-disabled="true"
            // onClick={handleSendFeedback}
          >
            Send feedback <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </section>

      <footer className="about-footer">
        <span>FoundYou · Campus lost and found</span>
        <span>Only shown to a verified match — never posted publicly.</span>
      </footer>
    </main>
  );
}
