import { useEffect, useRef, useState } from "react";
import {
  Search,
  Backpack,
  MapPin,
  ShieldCheck,
  Sparkles,
  SendHorizontal,
} from "lucide-react";
import "./agentPage.css";
import { categories } from "./categories";

// Match cards use the same fields as the server's get_item result
// (see server/src/tools.ts), so real items can replace these later.
type FoundItem = {
  id: string;
  item_type: string;
  colors: string[];
  area: string;
  found_at: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  items?: FoundItem[];
};

type RawMessage = {
  role: string;
  content: string | null;
  [key: string]: unknown;
};

// Color and location will come from the details collected during the chat.
const reportSummary: {
  color: { label: string; swatch: string } | null;
  location: string | null;
} = {
  color: null,
  location: null,
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function daysAgo(isoDate: string) {
  const days = Math.floor((Date.now() - Date.parse(isoDate)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function AgentPage() {
  const categoryId = new URLSearchParams(window.location.search).get("category");
  const category = categories.find(({ id }) => id === categoryId) ?? categories[0];
  const CategoryIcon = category.icon;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<RawMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleBack = () => {
    window.location.assign("/lost/category");
  };

  // Add these actions when the other pages are ready.
  // const handleOpenMatch = (itemId) => {};
  // const handleSeeAllMatches = () => {};

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setBusy(true);
    setError("");
    setInput("");

    setMessages((current) => [
      ...current,
      { role: "user", text },
    ]);

    const nextHistory: RawMessage[] = [
      ...history,
      {
        role: "user",
        content:
          history.length === 0 && categoryId
            ? `Selected category: ${category.label}.\n${text}`
            : text,
      },
    ];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not reach the agent.");
      }

      // Keep the complete assistant/tool history for subsequent turns.
      setHistory([
        ...nextHistory,
        ...data.newMessages,
      ]);

      const items: FoundItem[] = data.toolCalls
        .filter(
          (call: {
            name: string;
            result?: { item?: FoundItem };
          }) =>
            call.name === "get_item" &&
            call.result?.item
        )
        .map(
          (call: { result: { item: FoundItem } }) =>
            call.result.item
        );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply,
          items,
        },
      ]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Something went wrong."
      );

      // Restore an unsuccessful message so it can be retried.
      setMessages((current) => current.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="agent-page">
      <header className="agent-header">
        <a href="/" className="agent-logo">
          <span className="agent-logo-icon">
            <Search size={17} aria-hidden="true" />
          </span>
          <span>FoundYou</span>
        </a>

        <button
          type="button"
          className="agent-back-button"
          onClick={handleBack}
        >
          Back
        </button>
      </header>

      <div className="agent-layout">
        <aside className="agent-sidebar" aria-label="Your report so far">
          <h2 className="agent-sidebar-title">Your report so far</h2>

          <div className="agent-summary">
            <div className="agent-summary-row">
              <span className="agent-summary-icon highlighted">
                <CategoryIcon
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <div>
                <div className="agent-summary-value">{category.label}</div>
                <div className="agent-summary-label">Category</div>
              </div>
            </div>

            <div className="agent-summary-row">
              <span
                className={`agent-color-swatch ${
                  reportSummary.color ? "" : "empty"
                }`}
                style={
                  reportSummary.color
                    ? { background: reportSummary.color.swatch }
                    : undefined
                }
                aria-hidden="true"
              />
              <div>
                <div
                  className={`agent-summary-value ${
                    reportSummary.color ? "" : "empty"
                  }`}
                >
                  {reportSummary.color?.label ?? "Not yet known"}
                </div>
                <div className="agent-summary-label">Color — from chat</div>
              </div>
            </div>

            <div className="agent-summary-row">
              <span className="agent-summary-icon">
                <MapPin
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <div>
                <div
                  className={`agent-summary-value ${
                    reportSummary.location ? "" : "empty"
                  }`}
                >
                  {reportSummary.location ?? "Not yet known"}
                </div>
                <div className="agent-summary-label">
                  Location — from chat
                </div>
              </div>
            </div>
          </div>

          <p className="agent-privacy-note">
            <ShieldCheck
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>
              FoundYou helps you compare possible matches. It does not
              determine ownership.
            </span>
          </p>
        </aside>

        <main className="agent-chat">
          <div className="agent-chat-header">
            <span className="agent-avatar large">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <div className="agent-name">FoundYou Agent</div>
              <div className="agent-status">
                <span className="agent-status-dot" aria-hidden="true" />
                {busy ? "Searching reports…" : "Ready for your description"}
              </div>
            </div>
          </div>

          <div className="agent-messages" aria-live="polite">
            {messages.length === 0 && (
              <p className="agent-empty-state">
                Describe what you lost — color, any unique details, and where
                you last had it — and the agent will search reports.
                If the location or time is unknown, say so.
              </p>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`agent-message ${message.role}`}
              >
                {message.role === "assistant" && (
                  <span className="agent-avatar" aria-hidden="true" />
                )}

                <div className="agent-message-content">
                  <p className="agent-bubble">{message.text}</p>

                  {message.items?.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="agent-match-card"
                      aria-disabled="true"
                    >
                      <span className="agent-match-image">
                        <Backpack
                          size={24}
                          strokeWidth={1.4}
                          aria-hidden="true"
                        />
                      </span>

                      <span className="agent-match-text">
                        <span className="agent-match-title">
                          {capitalize(item.colors.join(" "))}{" "}
                          {item.item_type.replaceAll("_", " ")}
                        </span>

                        <span className="agent-match-detail">
                          {item.area || "Location not recorded"}
                          {" · "}
                          {item.found_at
                            ? item.found_at.slice(0, 10)
                            : "Date not recorded"}
                        </span>
                      </span>

                      <span className="agent-match-badge">
                        Possible match
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {busy && (
              <p role="status">Searching reports…</p>
            )}

            {error && (
              <p role="alert" style={{ color: "crimson" }}>
                {error}
              </p>
            )}

            <div ref={endRef} />
          </div>

          <form
            className="agent-input-bar"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <label className="agent-sr-only" htmlFor="agent-input">
              Type your answer
            </label>

            <input
              id="agent-input"
              className="agent-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your answer…"
              autoComplete="off"
              disabled={busy}
            />

            <button
              type="submit"
              className="agent-send-button"
              aria-label="Send"
              disabled={busy || !input.trim()}
            >
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </form>

          <div className="agent-see-all">
            <button
              type="button"
              className="agent-see-all-button"
              aria-disabled="true"
            >
              See all possible matches instead
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
