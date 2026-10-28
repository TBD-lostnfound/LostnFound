// MVP storage: one JSON file + an images folder. Keep all persistence behind this module
// so swapping to SQLite/Postgres later touches nothing else.
// Laptop: the local data/ folder. Cloud (GCS_BUCKET set): the Cloud Storage bucket, because
// Cloud Run's own disk is wiped on every restart. Run one instance only: items.json has no locking.
import { Storage } from "@google-cloud/storage";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "./config.js";
import type { Item } from "./schema.js";

const ITEMS_FILE = resolve(config.dataDir, "items.json");
const IMAGES_DIR = resolve(config.dataDir, "images");
const ITEMS_OBJECT = "data/items.json";
const imageObject = (name: string) => `images/${name}`;

const bucket = config.gcsBucket ? new Storage().bucket(config.gcsBucket) : null;

let items: Item[] | null = null;
let writing = Promise.resolve();

async function load(): Promise<Item[]> {
  if (items) return items;
  if (bucket) {
    const file = bucket.file(ITEMS_OBJECT);
    const [exists] = await file.exists();
    items = exists ? JSON.parse((await file.download())[0].toString("utf8")) : [];
  } else {
    await mkdir(IMAGES_DIR, { recursive: true });
    try { items = JSON.parse(await readFile(ITEMS_FILE, "utf8")); } catch { items = []; }
  }
  return items!;
}

async function persist() {
  const json = JSON.stringify(items, null, 2);
  if (bucket) {
    await bucket.file(ITEMS_OBJECT).save(json, { contentType: "application/json" });
    return;
  }
  const tmp = ITEMS_FILE + ".tmp";
  await writeFile(tmp, json);
  await rename(tmp, ITEMS_FILE);
}

export async function nextId(): Promise<string> {
  const all = await load();
  const max = all.reduce((m, it) => Math.max(m, Number(it.id.split("_")[1]) || 0), 0);
  return `item_${String(max + 1).padStart(4, "0")}`;
}

export async function saveImage(id: string, jpeg: Buffer): Promise<string> {
  await load();
  if (bucket) await bucket.file(imageObject(`${id}.jpg`)).save(jpeg, { contentType: "image/jpeg" });
  else await writeFile(resolve(IMAGES_DIR, `${id}.jpg`), jpeg);
  return `/images/${id}.jpg`;
}

/** Photo bytes for a name like "item_0042.jpg", or undefined if there is no such photo. */
export async function getImage(name: string): Promise<Buffer | undefined> {
  if (!/^item_\d+\.jpg$/.test(name)) return undefined; // also blocks paths like "../.env"
  try {
    if (bucket) return (await bucket.file(imageObject(name)).download())[0];
    return await readFile(resolve(IMAGES_DIR, name));
  } catch {
    return undefined;
  }
}

export async function saveItem(item: Item): Promise<void> {
  const all = await load();
  all.push(item);
  writing = writing.then(persist);
  await writing;
}

export async function listItems(): Promise<Item[]> {
  return [...(await load())].reverse();
}

export async function getItem(id: string): Promise<Item | undefined> {
  return (await load()).find((it) => it.id === id);
}
