// Run: npm --prefix image-recognition run selfcheck. Uses temporary storage and fake AI.
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const { config } = await import("./src/config.ts");
const originalConfig = { ...config };
const originalFetch = globalThis.fetch;
const originalBackend = process.env.IMAGE_BACKEND_URL;
const directory = await mkdtemp(join(tmpdir(), "foundyou-report-check-"));
Object.assign(config, { port: 0, dataDir: directory, gcsBucket: "", openrouterKey: "selfcheck-only" });

let server;
let base;
let visionCalls = 0;
const extraction = {
  observations: "A black backpack.", item_type: "backpack", item_type_other: null,
  colors: ["black"], pattern: "solid", materials: ["fabric"], brand_evidence: null,
  brand: null, model: null, distinguishing_marks: [], detected_text: [],
  caption: "A black backpack.", search_terms: ["bag", "backpack"],
};

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url === "https://openrouter.ai/api/v1/chat/completions") {
    visionCalls++;
    return Response.json({ choices: [{ message: { content: JSON.stringify(extraction) } }] });
  }
  if (base && url.startsWith(`${base}/`)) return originalFetch(input, init);
  throw new Error(`Unexpected external request in selfcheck: ${url}`);
};

try {
  ({ server } = await import("./src/index.ts"));
  if (!server.listening) await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  process.env.IMAGE_BACKEND_URL = base;
  const photo = await sharp({ create: { width: 8, height: 8, channels: 3, background: "black" } }).jpeg().toBuffer();
  const report = {
    category: "Bag", colors: ["blue"], color_description: "navy", found_at: "2026-11-17",
    location: "Woodruff Library, 2nd floor", details: "A yellow keychain.",
  };
  const upload = (value, { raw = false, type = "image/jpeg", bytes = photo } = {}) => {
    const body = new FormData();
    body.append("photo", new Blob([bytes], { type }), "bag.jpg");
    if (value !== undefined) body.append("report", raw ? value : JSON.stringify(value));
    body.append("device_lat", "33.79046");
    body.append("device_lng", "-84.32281");
    body.append("device_time", "2026-11-17T15:00:00Z");
    return fetch(`${base}/api/items`, { method: "POST", body });
  };

  assert.equal((await upload("{", { raw: true })).status, 400);
  assert.equal((await upload({ ...report, colors: ["not-a-color"] })).status, 400);
  assert.equal((await upload({ ...report, found_at: "2026-02-30" })).status, 400);
  assert.equal((await upload(report, { type: "text/plain" })).status, 400);
  assert.equal((await upload(report, { bytes: new Uint8Array() })).status, 400);
  assert.equal(visionCalls, 0, "Invalid requests must not spend an AI call");

  const saved = await upload(report);
  assert.equal(saved.status, 201);
  const item = await saved.json();
  assert.deepEqual(item.finder_report, report);
  assert.equal(item.found_at, report.found_at, "An unknown time must stay date-only");
  assert.equal(item.area, "Woodruff Library");
  assert.deepEqual(item.colors, ["blue"]);
  assert.equal(item.system.time_source, "finder");
  assert.equal(item.system.found_lat, null);
  assert.match(item.caption, /yellow keychain/);
  assert.deepEqual(JSON.parse(await readFile(join(directory, "items.json"), "utf8"))[0].finder_report, report);
  const image = await fetch(`${base}${item.image_url}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/jpeg");
  assert.ok((await image.arrayBuffer()).byteLength > 0);
  assert.equal((await (await fetch(`${base}/api/items/${item.id}`)).json()).id, item.id);

  const uncertain = await (await upload({ ...report, location: "not sure" })).json();
  assert.equal(uncertain.area, null, "Do not replace an unknown reported location with upload GPS");
  const precise = await (await upload({ ...report, found_at: "2026-11-17T15:00:00Z" })).json();
  assert.equal(precise.found_at, "2026-11-17T15:00:00Z");
  const legacy = await (await upload(undefined)).json();
  assert.equal(legacy.finder_report, undefined, "Photo-only clients must still work");
  assert.equal(legacy.system.time_source, "device");

  const { search_items, get_item } = await import("../server/src/tools.ts");
  const search = (lost_after) => search_items({ item_type: "backpack", area: "Woodruff Library", lost_after });
  const sameDay = await search("2026-11-18T01:00:00Z"); // Still November 17 in Eastern time.
  assert.ok(sameDay.results.some((r) => r.id === item.id));
  assert.ok(!sameDay.results.some((r) => r.id === precise.id));
  assert.ok(!(await search("2026-11-18T05:00:00Z")).results.some((r) => r.id === item.id));
  const globalSearch = await search_items({ item_type: "backpack" });
  assert.ok(globalSearch.results.some((r) => r.id === uncertain.id));
  const publicItem = (await get_item({ id: item.id })).item;
  assert.equal(publicItem.location_detail, report.location);
  assert.equal(publicItem.system, undefined);
  assert.equal(publicItem.finder_report, undefined);
  assert.equal(publicItem.detected_text, undefined);
  assert.equal(visionCalls, 4);
  console.log("PASS: upload validation, photo/details persistence, image retrieval, unknown location/time, legacy upload, and ranked search integration (fake AI only).");
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  globalThis.fetch = originalFetch;
  if (originalBackend === undefined) delete process.env.IMAGE_BACKEND_URL;
  else process.env.IMAGE_BACKEND_URL = originalBackend;
  Object.assign(config, originalConfig);
  await rm(directory, { recursive: true, force: true });
}
