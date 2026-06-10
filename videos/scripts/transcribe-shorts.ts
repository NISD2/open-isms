import path from "path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { execSync } from "child_process";
import fs from "fs";

const VIDEOS_DIR = path.join(import.meta.dir, "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");
const SHORTS_DIR = path.join(PUBLIC_DIR, "shorts");
const WHISPER_DIR = path.join(VIDEOS_DIR, "whisper.cpp");

const COMBINED_WAV = path.join(PUBLIC_DIR, "shorts-combined.wav");
const OUTPUT_JSON = path.join(PUBLIC_DIR, "captions-shorts.json");

// Clips in order — must match the composition clip order
const CLIPS = [
  "IMG_4998.MOV",
  "IMG_4999.MOV",
  "IMG_5001.MOV",
  "IMG_5002.MOV",
];

console.log("Step 1: Installing whisper.cpp (skips if already installed)...");
await installWhisperCpp({ to: WHISPER_DIR, version: "1.5.5" });

console.log("Step 2: Downloading model (skips if already downloaded)...");
await downloadWhisperModel({ model: "medium.en", folder: WHISPER_DIR });

console.log("Step 3: Concatenating audio from all clips to 16kHz WAV...");
const inputs = CLIPS.map((c) => `-i "${path.join(SHORTS_DIR, c)}"`).join(" ");
const filterInputs = CLIPS.map((_, i) => `[${i}:a]`).join("");
execSync(
  `ffmpeg ${inputs} -filter_complex "${filterInputs}concat=n=${CLIPS.length}:v=0:a=1[out]" -map "[out]" -ar 16000 -ac 1 -c:a pcm_s16le "${COMBINED_WAV}" -y`,
  { stdio: "inherit" },
);

console.log("Step 4: Transcribing combined audio...");
const whisperOutput = await transcribe({
  model: "medium.en",
  whisperPath: WHISPER_DIR,
  whisperCppVersion: "1.5.5",
  inputPath: COMBINED_WAV,
  tokenLevelTimestamps: true,
});

console.log("Step 5: Converting to captions...");
const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(captions, null, 2));
console.log(`Done! Wrote ${captions.length} captions to ${OUTPUT_JSON}`);

fs.unlinkSync(COMBINED_WAV);
console.log("Cleaned up combined WAV.");
