import { EventEmitter } from "events";

// Global SSE event bus — keyed by jobId
export const jobEvents = new EventEmitter();
jobEvents.setMaxListeners(50);

export type PipelineEvent =
  | { type: "status"; status: string; message?: string }
  | { type: "progress"; message: string }
  | { type: "error"; message: string }
  | { type: "done" };

export function emitJobEvent(jobId: string, event: PipelineEvent) {
  jobEvents.emit(jobId, event);
}

// Serial transcription queue — only one Whisper process at a time (CPU bound)
let transcribeChain: Promise<void> = Promise.resolve();

export function enqueueTranscription(fn: () => Promise<void>): void {
  transcribeChain = transcribeChain.then(() => fn()).catch(() => {});
}

// Renders are fire-and-forget (can run in parallel)
export function enqueueRender(fn: () => Promise<void>): void {
  fn().catch(() => {});
}
