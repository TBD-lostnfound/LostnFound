import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Camera, MapPin, Search, ShieldCheck, Upload } from "lucide-react";
import "./reportItem.css";

const categories = ["Electronics", "Bag", "Keys", "ID / Card", "Clothing", "Bottle", "Other"];
const colors = [
  { name: "Black", value: "#17252d" },
  { name: "White", value: "#ffffff" },
  { name: "Blue", value: "#2465f5" },
  { name: "Red", value: "#df3939" },
  { name: "Green", value: "#00a66b" },
  { name: "Gray", value: "#89919e" },
];

export default function ReportItem() {
  const [category, setCategory] = useState("Bag");
  const [color, setColor] = useState("Black");
  const [day, setDay] = useState("Today");
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      localStorage.setItem("foundyou-found-item-draft", JSON.stringify({
        category, color, day, location: location.trim(), details: details.trim(),
        photoName: photo?.name ?? null, savedAt: new Date().toISOString(),
      }));
      setMessage("Details saved on this device as a draft. Your report has not been submitted yet; submission is not connected. Photos are not saved with the draft.");
    } catch {
      setMessage("Unable to save your draft on this device. Please keep this page open so you don't lose your details.");
    }
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <a className="report-logo" href="/" aria-label="FoundYou home"><span><Search size={18} aria-hidden="true" /></span>FoundYou</a>
        <a className="report-home" href="/">Back to home</a>
      </header>
      <main className="report-layout">
        <aside className="report-upload">
          <div className={`report-photo-ring${preview ? " has-photo" : ""}`}>
            <div className="report-photo-circle">{preview ? <img src={preview} alt="Selected found item" /> : <Camera size={38} strokeWidth={1.7} aria-hidden="true" />}</div>
          </div>
          <h2>Upload a photo of the item</h2>
          <p>Take a photo or upload from your device —<br />we’ll help identify and match it with lost reports.</p>
          <input ref={fileInput} className="report-file" type="file" accept="image/*" aria-label="Upload a photo of the item" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); event.target.value = ""; return; }
            setPhoto(file); setMessage("");
          }} />
          <button className="report-add-photo" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} aria-hidden="true" />{photo ? "Change Photo" : "Add Photo"}</button>
          <p className="report-privacy"><ShieldCheck size={15} aria-hidden="true" /><span>Only shown to a verified match — never posted publicly.</span></p>
        </aside>
        <section className="report-details">
          <h1>Add a few details</h1>
          <p className="report-description">A couple of quick fields help the right person find it faster.</p>
          <form onSubmit={submit} onChange={() => setMessage("")}>
            <div className="report-top-row">
              <fieldset><legend>What is it?</legend><div className="report-category-options">{categories.map((item) => <button type="button" key={item} className={`report-chip${category === item ? " is-selected" : ""}`} aria-pressed={category === item} onClick={() => { setCategory(item); setMessage(""); }}>{item}</button>)}</div></fieldset>
              <fieldset><legend>Color</legend><div className="report-colors">{colors.map((item) => <button key={item.name} type="button" className={`report-color${color === item.name ? " is-selected" : ""}`} style={{ backgroundColor: item.value }} aria-label={item.name} aria-pressed={color === item.name} onClick={() => { setColor(item.name); setMessage(""); }} />)}</div></fieldset>
            </div>
            <div className="report-middle-row">
              <div><label className="report-label" htmlFor="found-location">Where did you find it?</label><div className="report-location"><MapPin size={17} aria-hidden="true" /><input id="found-location" required maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g., Library, 2nd floor" pattern=".*\S.*" /></div></div>
              <fieldset><legend>When did you find it?</legend><div className="report-days">{["Today", "Yesterday"].map((item) => <button key={item} type="button" className={`report-day${day === item ? " is-selected" : ""}`} aria-pressed={day === item} onClick={() => { setDay(item); setMessage(""); }}>{item}</button>)}</div></fieldset>
            </div>
            <label className="report-label" htmlFor="found-details">Additional details (optional)</label>
            <textarea id="found-details" value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="e.g., brand, keychain, stickers, or anything unique..." />
            <button className="report-submit" type="submit">Submit found item <ArrowRight size={18} aria-hidden="true" /></button>
            {message && <p className="report-message" role="status">{message}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
