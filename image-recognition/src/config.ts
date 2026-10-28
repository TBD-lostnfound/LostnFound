import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..");
// Shares the repo-root .env (OPENROUTER_API_KEY lives there).
try { process.loadEnvFile(resolve(ROOT, "../.env")); } catch { /* fall back to the real environment */ }

export const config = {
  port: Number(process.env.IMAGE_RECOGNITION_PORT ?? 8790),
  openrouterKey: process.env.OPENROUTER_API_KEY ?? "",
  visionModel: process.env.VISION_MODEL ?? "openai/gpt-6-luna",
  dataDir: resolve(ROOT, "data"),
  // Set on Cloud Run (e.g. lostnfound-370-images). Empty = use the local data/ folder.
  gcsBucket: process.env.GCS_BUCKET ?? "",
  publicDir: resolve(ROOT, "public"),
  timeZone: "America/New_York",
};
