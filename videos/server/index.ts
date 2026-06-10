import { Hono } from "hono";
import { cors } from "hono/cors";
import path from "path";
import fs from "fs";
import uploadRoute from "./routes/upload";
import jobsRoute from "./routes/jobs";
import clipsRoute from "./routes/clips";
import sectionsRoute from "./routes/sections";

const app = new Hono();

app.use("*", cors());

// API routes
app.route("/api/upload", uploadRoute);
app.route("/api/jobs", jobsRoute);
app.route("/api/clips", clipsRoute);
app.route("/api/sections", sectionsRoute);

// Serve static files from public/ and out/
const VIDEOS_DIR = path.join(import.meta.dir, "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");
const OUT_DIR = path.join(VIDEOS_DIR, "out");

app.get("/public/:filename{.+}", (c) => {
  const filename = c.req.param("filename");
  const filePath = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);
  const file = Bun.file(filePath);
  return new Response(file);
});

app.get("/out/:filepath{.+}", (c) => {
  const filepath = c.req.param("filepath");
  const filePath = path.join(OUT_DIR, filepath);
  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);
  const file = Bun.file(filePath);
  return new Response(file);
});

// Serve the single-page UI
const UI_PATH = path.join(import.meta.dir, "ui", "index.html");
app.get("/", (c) => {
  const html = fs.readFileSync(UI_PATH, "utf-8");
  return c.html(html);
});

const PORT = 3030;
console.log(`Video Shorts Pipeline running at http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
  // Allow large video uploads (up to 8GB)
  maxRequestBodySize: 8 * 1024 * 1024 * 1024,
  // SSE connections must not time out — transcription takes several minutes
  idleTimeout: 0,
};
