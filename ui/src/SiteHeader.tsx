import { Search } from "lucide-react";

// Design-only nav item. Connect this handler when sign-in is ready.
// const handleSignIn = () => {};

type Props = { current?: "about" };

// Logo and main navigation shared by the homepage and the About page.
export default function SiteHeader({ current }: Props) {
  return (
    <header className="site-header">
      <a href="/" className="fy-logo">
        <span className="fy-logo-icon"><Search size={20} strokeWidth={2.4} aria-hidden="true" /></span>
        FoundYou
      </a>
      <nav aria-label="Main navigation">
        <a href="/#how-it-works" className="site-nav-link">How it works</a>
        <a href="/about" className="site-nav-link" aria-current={current === "about" ? "page" : undefined}>About</a>
        <button type="button" className="site-sign-in" aria-disabled="true"
          // onClick={handleSignIn}
        >Sign In</button>
      </nav>
    </header>
  );
}
