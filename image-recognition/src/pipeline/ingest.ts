// Photo and optional finder-entered details in → stored item out.
import { saveImage, saveItem, nextId } from "../store.js";
import type { FinderReport, Item } from "../schema.js";
import { areaFor, CAMPUS_AREAS } from "./areas.js";
import { normalizePhoto } from "./image.js";
import { readFoundMeta, type DeviceHints } from "./metadata.js";
import { postprocess } from "./postprocess.js";
import { extract, PROMPT_VERSION } from "./vision.js";

export async function ingestPhoto(photo: Buffer, device: DeviceHints, report?: FinderReport): Promise<Item> {
  const meta = await readFoundMeta(photo, device); // read EXIF before normalizing strips it
  const jpeg = await normalizePhoto(photo);
  const vision = await extract(jpeg);
  const x = postprocess(vision.extraction);
  const id = await nextId();
  const enteredLocation = report?.location.toLowerCase();
  // Match an explicit campus name; do not infer an area from vague text such as "library".
  const reportedArea = CAMPUS_AREAS.find((area) =>
    enteredLocation === area.toLowerCase() ||
    enteredLocation?.startsWith(`${area.toLowerCase()},`)
  ) ?? null;

  const item: Item = {
    ...(report ? { finder_report: report } : {}),
    id,
    image_url: await saveImage(id, jpeg),
    found_at: report?.found_at ?? meta.found_at,
    area: report ? reportedArea : meta.lat != null && meta.lng != null ? areaFor(meta.lat, meta.lng).area : null,
    category: x.category,
    item_type: x.item_type,
    item_type_other: x.item_type_other,
    colors: report?.colors ?? x.colors,
    color_primary: report?.colors[0] ?? x.color_primary,
    pattern: x.pattern,
    materials: x.materials,
    brand: x.brand,
    model: x.model,
    distinguishing_marks: x.distinguishing_marks,
    detected_text: x.detected_text,
    caption: [x.caption, report?.color_description, report?.details].filter(Boolean).join(" "),
    search_terms: x.search_terms,
    system: {
      found_lat: report ? null : meta.lat,
      found_lng: report ? null : meta.lng,
      location_source: report ? "finder" : meta.location_source,
      time_source: report ? "finder" : meta.time_source,
      observations: x.observations,
      brand_evidence: x.brand_evidence,
      status: "available",
      created_at: new Date().toISOString(),
      extraction: { model: vision.model, prompt_version: PROMPT_VERSION, latency_ms: vision.latency_ms, cost_usd: vision.cost_usd },
    },
  };
  await saveItem(item);
  return item;
}
