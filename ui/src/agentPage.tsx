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

// Public fields returned by the agent's get_item tool.
type FoundItem = {
  id: string;
  item_type: string;
  colors: string[];
  area: string;
  found_at: string;
  image_url?: string;
  description?: string;
  brand?: string | null;
  location_detail?: string | null;
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

type ReportSummary = {
  color: { label: string; swatch: string } | null;
  location: string | null;
};

// Load item photos through the website proxy in both local and cloud deployments.
function itemPhoto(url?: string) {
  try {
    const path = new URL(url ?? "", window.location.origin).pathname;
    return /^\/images\/item_\d+\.jpg$/.test(path) ? path : undefined;
  } catch { return undefined; }
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
  const [reportSummary, setReportSummary] = useState<ReportSummary>({ color: null, location: null });
  const [details, setDetails] = useState<FoundItem[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allMatches = [...new Map(messages.flatMap((m) => m.items ?? []).map((item) => [item.id, item])).values()];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (details.length && !dialog.open) dialog.showModal();
    if (!details.length && dialog.open) dialog.close();
  }, [details]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleBack = () => {
    window.location.assign("/lost/category");
  };

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

      // An empty or non-JSON reply means the agent server is down or unreachable.
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error(data?.error || `Agent request failed (${response.status})`);
      }

      // Keep the complete assistant/tool history for subsequent turns.
      setHistory([
        ...nextHistory,
        ...data.newMessages,
      ]);

      // Show the latest actual search criteria, including an intentionally omitted area.
      const searches = data.toolCalls.filter((call: { name: string }) => call.name === "search_items");
      const search = searches[searches.length - 1];
      if (search) {
        const args = search.arguments;
        const colors: string[] = Array.isArray(args.colors) ? args.colors : [];
        const swatches = colors.flatMap((c) => c === "multicolor" ? ["red", "gold", "green", "blue"] : [c]);
        setReportSummary({
          color: colors.length ? {
            label: colors.map(capitalize).join(", "),
            swatch: swatches.length === 1 ? swatches[0] : `linear-gradient(90deg, ${swatches.join(", ")})`,
          } : null,
          location: args.area || "All campus areas",
        });
      }

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
      // Keep the technical details in the console and show a plain message.
      console.error("Agent chat failed:", reason);
      setError(
        "We couldn't reach the FoundYou Agent. Please try again in a moment."
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
      <header className="fy-header agent-header">
        <div className="fy-header-inner">
          <a href="/" className="fy-logo">
            <span className="fy-logo-icon">
              <Search size={19} strokeWidth={2.4} aria-hidden="true" />
            </span>
            FoundYou
          </a>

          <ol className="fy-progress" aria-label="Step 2 of 3">
            <li className="done" />
            <li className="done" />
            <li />
          </ol>

          <button
            type="button"
            className="fy-back-link"
            onClick={handleBack}
          >
            Back
          </button>
        </div>
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
                <div className="agent-summary-label">Colors searched</div>
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
                  Area searched
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
              <Sparkles size={19} aria-hidden="true" />
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
                      onClick={() => setDetails([item])}
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
              <div className="agent-message assistant" role="status">
                <span className="agent-avatar" aria-hidden="true" />
                <p className="agent-bubble agent-typing">
                  <span className="agent-sr-only">Searching reports…</span>
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="agent-error">
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
              disabled={allMatches.length === 0}
              onClick={() => setDetails(allMatches)}
            >
              Review matches shown in this chat
            </button>
          </div>
        </main>
      </div>
      <dialog ref={dialogRef} className="agent-detail-dialog" aria-labelledby="match-details-title" onClose={() => setDetails([])}>
        <h2 id="match-details-title">Possible matches</h2>
        <p>Compare the details. Ownership must be verified separately.</p>
        {details.map((item) => (
          <article key={item.id}>
            {itemPhoto(item.image_url) && <img src={itemPhoto(item.image_url)} alt={item.item_type.replaceAll("_", " ")} />}
            <h3>{capitalize(item.colors.join(" "))} {item.item_type.replaceAll("_", " ")}</h3>
            <p>{item.description || "No description recorded."}</p>
            <p>Location: {item.location_detail || item.area || "Not recorded"}</p>
            <p>Found: {item.found_at?.slice(0, 10) || "Not recorded"}</p>
            {item.brand && <p>Brand: {item.brand}</p>}
            <p>Reference: {item.id}</p>
          </article>
        ))}
        <button type="button" className="fy-btn fy-btn-primary" onClick={() => dialogRef.current?.close()}>Close</button>
      </dialog>
    </div>
  );
}
