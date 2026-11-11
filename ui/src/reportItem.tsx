import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Camera, MapPin, Search, ShieldCheck, Upload } from "lucide-react";
import "./reportItem.css";

const categories = ["Electronics", "Bag", "Keys", "ID / Card", "Clothing", "Bottle", "Other"];
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
];

// Everyday color words mapped to the fixed list.
const colorWords: Record<string, string> = {
  grey: "gray", charcoal: "gray", navy: "blue", cobalt: "blue", teal: "blue", turquoise: "blue", sky: "blue",
  maroon: "red", burgundy: "red", crimson: "red", scarlet: "red", tan: "beige", khaki: "beige", cream: "beige",
  ivory: "white", olive: "green", lime: "green", mint: "green", violet: "purple", lavender: "purple",
  magenta: "pink", rose: "pink", metallic: "silver", rainbow: "multicolor", multi: "multicolor",
};

const titleCase = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

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
  const [category, setCategory] = useState("Bag");
  const [selectedColors, setSelectedColors] = useState<string[]>(["black"]);
  const [colorText, setColorText] = useState("");
  const [shade, setShade] = useState("#17252d");
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const textColors = colorsFromText(colorText);
  const addColors = (names: string[]) => setSelectedColors((current) => [...new Set([...current, ...names])]);
  const toggleColor = (name: string) => setSelectedColors((current) => current.includes(name) ? current.filter((c) => c !== name) : [...current, name]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const colorsToSave = [...new Set([...selectedColors, ...textColors])];
    if (colorsToSave.length === 0) { setMessage("Please pick at least one color."); return; }
    try {
      localStorage.setItem("foundyou-found-item-draft", JSON.stringify({
        category, colors: colorsToSave, colorDescription: colorText.trim(),
        found_at: new Date(`${date}T${time || "12:00"}`).toISOString(), timeKnown: Boolean(time),
        location: location.trim(), details: details.trim(),
        photoName: photo?.name ?? null, savedAt: new Date().toISOString(),
      }));
      setMessage("Details saved on this device as a draft. Your report has not been submitted yet; submission is not connected. Photos are not saved with the draft.");
    } catch {
      setMessage("Unable to save your draft on this device. Please keep this page open so you don't lose your details.");
    }
  }

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
          <h2 className="fy-rise fy-delay-1">Upload a photo of the item</h2>
          <p className="fy-rise fy-delay-1">Take a photo or upload one. We’ll help identify it and match it with lost reports.</p>
          <input ref={fileInput} className="report-file" type="file" accept="image/*" aria-label="Upload a photo of the item" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); event.target.value = ""; return; }
            setPhoto(file); setMessage("");
          }} />
          <button className="fy-btn fy-btn-primary report-add-photo fy-rise fy-delay-2" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} aria-hidden="true" />{photo ? "Change Photo" : "Add Photo"}</button>
          <p className="report-privacy"><ShieldCheck size={15} aria-hidden="true" /><span>Only shown to a verified match — never posted publicly.</span></p>
        </aside>
        <section className="report-details">
          <h1 className="fy-rise">Add a few details</h1>
          <p className="report-description fy-rise fy-delay-1">A couple of quick fields help the right person find it faster.</p>
          <form className="fy-rise fy-delay-2" onSubmit={submit} onChange={() => setMessage("")}>
            <fieldset className="report-row"><legend>What is it?</legend><div className="report-category-options">{categories.map((item) => <button type="button" key={item} className={`report-chip${category === item ? " is-selected" : ""}`} aria-pressed={category === item} onClick={() => { setCategory(item); setMessage(""); }}>{item}</button>)}</div></fieldset>
            <fieldset className="report-row">
              <legend>Color <span className="report-legend-hint">Pick all that apply</span></legend>
              <div className="report-colors">{colors.map((item) => <button key={item.name} type="button" className={`report-color${selectedColors.includes(item.name) ? " is-selected" : ""}`} style={{ background: item.value }} title={titleCase(item.name)} aria-label={titleCase(item.name)} aria-pressed={selectedColors.includes(item.name)} onClick={() => { toggleColor(item.name); setMessage(""); }} />)}</div>
              <div className="report-color-extra">
                <label className="report-shade" title="Pick the exact shade">
                  <input type="color" value={shade} aria-label="Pick the exact shade" onChange={(event) => { setShade(event.target.value); addColors([nearestColor(event.target.value)]); }} />
                  <span>Exact shade</span>
                </label>
                <input className="report-color-text" value={colorText} maxLength={100} onChange={(event) => setColorText(event.target.value)} onBlur={() => addColors(textColors)} placeholder="Describe it (optional), e.g., navy with white stripes" aria-label="Describe the color" />
              </div>
              <p className="report-hint" aria-live="polite">{selectedColors.length || textColors.length ? <>Matched as: <strong>{[...new Set([...selectedColors, ...textColors])].map(titleCase).join(", ")}</strong></> : "No color picked yet"}</p>
            </fieldset>
            <div className="report-middle-row">
              <div className="report-card"><label className="report-label" htmlFor="found-location">Where did you find it?</label><div className="report-location"><MapPin size={17} aria-hidden="true" /><input id="found-location" required maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g., Library, 2nd floor" pattern=".*\S.*" /></div></div>
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
            <div className="report-card">
              <label className="report-label" htmlFor="found-details">Additional details (optional)</label>
              <textarea id="found-details" value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="e.g., brand, keychain, stickers, or anything unique..." />
            </div>
            <button className="fy-btn fy-btn-primary report-submit" type="submit">Submit found item <ArrowRight size={18} aria-hidden="true" /></button>
            {message && <p className="report-message" role="status">{message}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
