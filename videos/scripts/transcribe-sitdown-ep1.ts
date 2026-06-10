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
const WHISPER_DIR = path.join(VIDEOS_DIR, "whisper.cpp");

const INPUT_VIDEO = path.join(PUBLIC_DIR, "NISD2-Episode-1.mp4");
const AUDIO_WAV = path.join(PUBLIC_DIR, "sitdown-ep1-audio.wav");
const OUTPUT_JSON = path.join(PUBLIC_DIR, "captions-sitdown-ep1.json");

console.log("Step 1: Installing whisper.cpp...");
await installWhisperCpp({ to: WHISPER_DIR, version: "1.5.5" });

console.log("Step 2: Downloading model (medium.en)...");
await downloadWhisperModel({ model: "medium.en", folder: WHISPER_DIR });

console.log("Step 3: Extracting 16kHz audio...");
execSync(
  `ffmpeg -i "${INPUT_VIDEO}" -ar 16000 -ac 1 -c:a pcm_s16le "${AUDIO_WAV}" -y`,
  { stdio: "inherit" }
);

console.log("Step 4: Transcribing...");
const whisperOutput = await transcribe({
  model: "medium.en",
  whisperPath: WHISPER_DIR,
  whisperCppVersion: "1.5.5",
  inputPath: AUDIO_WAV,
  tokenLevelTimestamps: true,
});

console.log("Step 5: Converting to captions...");
const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(captions, null, 2));
console.log(`Done! Wrote ${captions.length} captions to ${OUTPUT_JSON}`);

fs.unlinkSync(AUDIO_WAV);
console.log("Cleaned up temp WAV file.");
