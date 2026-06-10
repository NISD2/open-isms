import path from "path";
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";

const WHISPER_DIR = path.join(import.meta.dir, "..", "..", "whisper.cpp");

export const WHISPER_MODEL = "medium.en" as const;
export const WHISPER_VERSION = "1.5.5" as const;
export { WHISPER_DIR };

let ensured = false;

export async function ensureWhisper(): Promise<void> {
  if (ensured) return;
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });
  ensured = true;
}
