import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Camera, MapPin, Pencil, Search, ShieldCheck, Sparkles, Upload } from "lucide-react";
import "./reportItem.css";

// Same campus areas as the agent searches (image-recognition/src/pipeline/areas.ts). Picking one of
// these, rather than typing free text, lets the item show up when an owner searches by area.
const campusAreas = [
  "Woodruff Library", "Emory Student Center", "DCT", "Cox Hall", "WoodPEC",
  "Science buildings (MSC, Atwood, PAIS)", "Humanities buildings (Callaway, White Hall, Candler Library)",
  "Goizueta Business School", "Rollins School of Public Health",
  "Residence halls (Raoul, Hamilton, Turman, Dobbs, Alabama, Clifton Towers, Woodies, Complex, Harris Hall)",
  "The Quad", "McDonough Field", "Cliff Shuttle / Asbury Circle", "Parking decks",
];
const OTHER_AREA = "Other / not sure";

// What the photo reader sees in the photo (POST /api/items/analyze).
type Analysis = { item_type: string; item_type_other: string | null; colors: string[]; brand: string | null; caption: string };
// Same fixed list as `colors` in docs/foundyou-tool-contract.md, so reports match what the agent searches.
const colors = [
  { name: "black", value: "#17252d" },
  { name: "white", value: "#ffffff" },
  { name: "gray", value: "#89919e" },
  { name: "silver", value: "#c4c9d1" },
  { name: "brown", value: "#7a4b2a" },
  { name: "beige", value: "#e3cfa6" },
  { name: "red", value: "#df3939" },
  { name: "orange", value: "#f58a1f" },
  { name: "yellow", value: "#f5cf2a" },
  { name: "green", value: "#00a66b" },
  { name: "blue", value: "#2465f5" },
  { name: "purple", value: "#8746d8" },
  { name: "pink", value: "#f27bb4" },
  { name: "gold", value: "#c9a227" },
  { name: "multicolor", value: "conic-gradient(#df3939, #f5cf2a, #00a66b, #2465f5, #8746d8, #df3939)" },
  { name: "clear", value: "repeating-conic-gradient(#e7ebf0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px" },
];

// Everyday color words mapped to the fixed list.
const colorWords: Record<string, string> = {
  grey: "gray", charcoal: "gray", navy: "blue", cobalt: "blue", teal: "blue", turquoise: "blue", sky: "blue",
  maroon: "red", burgundy: "red", crimson: "red", scarlet: "red", tan: "beige", khaki: "beige", cream: "beige",
  ivory: "white", olive: "green", lime: "green", mint: "green", violet: "purple", lavender: "purple",
  magenta: "pink", rose: "pink", metallic: "silver", rainbow: "multicolor", multi: "multicolor",
};

const titleCase = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
const swatchFor = (name: string) => colors.find((c) => c.name === name)?.value ?? "#ccc";

// "other_electronics" + "TV" -> "TV"; "water_bottle" -> "Water bottle".
function itemLabel(a: Analysis) {
  const name = a.item_type_other || a.item_type.replace(/^other_?/, "").replace(/_or_/g, " or ").replace(/_/g, " ") || "Item";
  return titleCase((a.brand ? `${a.brand} ` : "") + name);
}

function colorsFromText(text: string) {
  const found = new Set<string>();
  for (const word of text.toLowerCase().split(/[^a-z]+/)) {
    if (colors.some((c) => c.name === word)) found.add(word);
    else if (colorWords[word]) found.add(colorWords[word]);
  }
  return [...found];
}

// Picks the fixed color closest to a shade chosen in the color picker.
function nearestColor(hex: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(hex);
  let best = colors[0].name, bestDistance = Infinity;
  for (const c of colors) {
    if (!c.value.startsWith("#")) continue;
    const [r2, g2, b2] = rgb(c.value);
    const distance = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (distance < bestDistance) { best = c.name; bestDistance = distance; }
  }
  return best;
}

// Dates as YYYY-MM-DD in the user's own time zone, which is what <input type="date"> uses.
function localDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function describeWhen(date: string, time: string) {
  if (!date) return "";
  const when = new Date(`${date}T${time || "12:00"}`);
  const day = date === localDate() ? "Today" : date === localDate(1) ? "Yesterday"
    : when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return time ? `${day} at ${when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : `${day}, time not sure`;
}

export default function ReportItem() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [colorsEdited, setColorsEdited] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorText, setColorText] = useState("");
  const [shade, setShade] = useState("#17252d");
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [area, setArea] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const submitLock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Read the photo as soon as it's chosen, so the finder only checks and corrects the result.
  useEffect(() => {
    if (!photo) return;
    const controller = new AbortController();
    setAnalysis(null); setAnalysisFailed(false); setAnalyzing(true);
    setColorsEdited(false); setEditingColors(false); setSelectedColors([]);
    const form = new FormData();
    form.append("photo", photo);
    fetch("/api/items/analyze", { method: "POST", body: form, signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || !Array.isArray(data.colors)) throw new Error("Analysis failed");
        setAnalysis(data);
        setSelectedColors(data.colors);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Photo analysis failed:", error);
        setAnalysisFailed(true);
        setEditingColors(true);
      })
      .finally(() => { if (!controller.signal.aborted) setAnalyzing(false); });
    return () => controller.abort();
  }, [photo]);

  const textColors = colorsFromText(colorText);
  const shownColors = [...new Set([...selectedColors, ...textColors])];
  const editColors = (update: (current: string[]) => string[]) => { setColorsEdited(true); setSelectedColors(update); };
  const addColors = (names: string[]) => { if (names.length) editColors((current) => [...new Set([...current, ...names])]); };
  const toggleColor = (name: string) => editColors((current) => current.includes(name) ? current.filter((c) => c !== name) : [...current, name]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || submittedId) return;
    if (!photo || !photo.type.startsWith("image/")) {
      setMessage("Please add a photo of the item.");
      return;
    }
    if (photo.size === 0 || photo.size > 15 * 1024 * 1024) {
      setMessage("Choose a non-empty photo under 15 MB.");
      return;
    }
    if (!area || !date) {
      setMessage("Please choose where and when you found it.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setMessage("");
    const detail = locationDetail.trim();
    // "Woodruff Library, 2nd floor" is the format the photo reader matches to a campus area.
    const location = area === OTHER_AREA ? detail || OTHER_AREA : detail ? `${area}, ${detail}` : area;
    // Only send colors the finder changed or picked; otherwise the photo reader keeps the AI's colors.
    const sendColors = (colorsEdited || analysisFailed || textColors.length > 0) && shownColors.length > 0;
    try {
      const form = new FormData();
      form.append("photo", photo);
      form.append("report", JSON.stringify({
        ...(sendColors ? { colors: shownColors } : {}),
        color_description: colorText.trim(),
        // A missing time stays unknown rather than becoming an invented noon timestamp.
        found_at: time ? new Date(`${date}T${time}`).toISOString() : date,
        location, details: details.trim(),
      }));
      const response = await fetch("/api/items", { method: "POST", body: form });
      const item = await response.json().catch(() => null);
      if (!response.ok || typeof item?.id !== "string") throw new Error("Submission failed");
      setSubmittedId(item.id);
      setMessage(`Found item submitted. Reference: ${item.id}.`);
    } catch {
      submitLock.current = false;
      setMessage("The report could not be submitted. Your details are still here; please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const colorEditor = (
    <div className="report-color-editor">
      <div className="report-colors">{colors.map((item) => <button key={item.name} type="button" className={`report-color${selectedColors.includes(item.name) ? " is-selected" : ""}`} style={{ background: item.value }} title={titleCase(item.name)} aria-label={titleCase(item.name)} aria-pressed={selectedColors.includes(item.name)} onClick={() => { toggleColor(item.name); setMessage(""); }} />)}</div>
      <div className="report-color-extra">
        <label className="report-shade" title="Pick the exact shade">
          <input type="color" value={shade} aria-label="Pick the exact shade" onChange={(event) => { setShade(event.target.value); addColors([nearestColor(event.target.value)]); }} />
          <span>Exact shade</span>
        </label>
        <input className="report-color-text" value={colorText} maxLength={100} onChange={(event) => setColorText(event.target.value)} onBlur={() => addColors(textColors)} placeholder="Describe it (optional), e.g., navy with white stripes" aria-label="Describe the color" />
      </div>
    </div>
  );

  return (
    <div className="report-page">
      <header className="fy-header">
        <div className="fy-header-inner report-header-inner">
          <a className="fy-logo" href="/"><span className="fy-logo-icon"><Search size={19} strokeWidth={2.4} aria-hidden="true" /></span>FoundYou</a>
          <a className="fy-back-link" href="/">Back to home</a>
        </div>
      </header>
      <main className="report-layout">
        <aside className="report-upload">
          <div className={`report-photo-ring fy-rise${preview ? " has-photo" : ""}`}>
            <div className="report-photo-circle">{preview ? <img src={preview} alt="Selected found item" /> : <Camera size={38} strokeWidth={1.7} aria-hidden="true" />}</div>
          </div>
          <h2 className="fy-rise fy-delay-1">{photo ? "Photo added" : "Start with a photo"}</h2>
          <p className="fy-rise fy-delay-1">We’ll work out what the item is and its colors, so you only need to check them.</p>
          <input ref={fileInput} className="report-file" type="file" accept="image/*" aria-label="Upload a photo of the item" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); event.target.value = ""; return; }
            setPhoto(file); setMessage("");
          }} />
          <button className="fy-btn fy-btn-primary report-add-photo fy-rise fy-delay-2" type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(submittedId)}><Upload size={15} aria-hidden="true" />{photo ? "Change Photo" : "Add Photo"}</button>
          <p className="report-privacy"><ShieldCheck size={15} aria-hidden="true" /><span>Use a sample item photo for this demo. Ownership must be verified separately.</span></p>
        </aside>
        <section className="report-details">
          <h1 className="fy-rise">Check the details</h1>
          <p className="report-description fy-rise fy-delay-1">We read your photo. Fix anything we got wrong, then tell us where and when you found it.</p>
          <form className="fy-rise fy-delay-2" onSubmit={submit} onChange={() => { if (!submittedId) setMessage(""); }}>
            <fieldset className="report-row report-ai" aria-busy={analyzing}>
              <legend><Sparkles size={13} aria-hidden="true" /> What we see</legend>
              {!photo && (
                <div className="report-ai-empty">
                  <p>Add a photo and we’ll fill this in for you.</p>
                  <button type="button" className="fy-btn fy-btn-secondary" onClick={() => fileInput.current?.click()}><Upload size={15} aria-hidden="true" />Add Photo</button>
                </div>
              )}
              {analyzing && (
                <div className="report-ai-loading" role="status">
                  <span className="report-ai-spinner" aria-hidden="true" />
                  <span>Reading your photo…</span>
                </div>
              )}
              {analysis && !analyzing && (
                <div className="report-ai-result">
                  <p className="report-ai-label">{itemLabel(analysis)}</p>
                  <div className="report-ai-colors" aria-label="Colors">
                    {shownColors.map((name) => <span key={name} className="report-ai-color"><span style={{ background: swatchFor(name) }} aria-hidden="true" />{titleCase(name)}</span>)}
                    {colorsEdited && <span className="report-ai-edited">Changed by you</span>}
                  </div>
                  <p className="report-ai-caption">{analysis.caption}</p>
                  {!editingColors && (
                    <button type="button" className="report-ai-edit" onClick={() => setEditingColors(true)}><Pencil size={14} aria-hidden="true" />Edit colors</button>
                  )}
                </div>
              )}
              {analysisFailed && !analyzing && (
                <p className="report-ai-failed">We couldn’t read this photo. Pick the colors yourself, and describe the item below.</p>
              )}
              {photo && !analyzing && editingColors && colorEditor}
              {photo && !analyzing && editingColors && (
                <p className="report-hint" aria-live="polite">{shownColors.length ? <>Matched as: <strong>{shownColors.map(titleCase).join(", ")}</strong></> : "No color picked yet"}</p>
              )}
            </fieldset>

            <div className="report-card">
              <label className="report-label" htmlFor="found-details">Anything we got wrong or missed? (optional)</label>
              <textarea id="found-details" value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="e.g., It’s a TV, not a monitor. Has a crack in the corner." />
            </div>

            <div className="report-middle-row">
              <div className="report-card">
                <label className="report-label" htmlFor="found-area">Where did you find it?</label>
                <div className="report-location">
                  <MapPin size={17} aria-hidden="true" />
                  <select id="found-area" required value={area} onChange={(event) => setArea(event.target.value)}>
                    <option value="" disabled>Choose a campus area</option>
                    {campusAreas.map((name) => <option key={name} value={name}>{name}</option>)}
                    <option value={OTHER_AREA}>{OTHER_AREA}</option>
                  </select>
                </div>
                <input className="report-location-detail" aria-label="More detail about where you found it (optional)" maxLength={120} value={locationDetail} onChange={(event) => setLocationDetail(event.target.value)} placeholder={area === OTHER_AREA ? "Where was it? e.g., Oxford Road bus stop" : "More detail (optional), e.g., 2nd floor"} />
              </div>
              <fieldset className="report-card">
                <legend>When did you find it?</legend>
                <div className="report-days">{[["Today", localDate()], ["Yesterday", localDate(1)]].map(([label, value]) => <button key={label} type="button" className={`report-day${date === value ? " is-selected" : ""}`} aria-pressed={date === value} onClick={() => { setDate(value); setMessage(""); }}>{label}</button>)}</div>
                <div className="report-when-inputs">
                  <label><span>Date</span><input type="date" required value={date} min={localDate(90)} max={localDate()} onChange={(event) => setDate(event.target.value)} /></label>
                  <label><span>Time (optional)</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
                </div>
                <p className="report-hint" aria-live="polite">{describeWhen(date, time)}</p>
              </fieldset>
            </div>

            <button className="fy-btn fy-btn-primary report-submit" type="submit" disabled={submitting || analyzing || Boolean(submittedId)}>
              {submitting ? "Submitting…" : submittedId ? "Report submitted" : analyzing ? "Reading your photo…" : "Submit found item"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {message && <p className="report-message" role="status">{message}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
