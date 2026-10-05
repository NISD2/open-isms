import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * The pictures drawn for the lessons so far, keyed "<courseId>/<lesson>", read once from
 * public/images/training. A lesson without one gets no picture, rather than a broken image, so a
 * lesson added later renders before its picture exists. A course's own picture and its modules'
 * are part of the course data (courses/<id>/index.ts).
 */
const ART: ReadonlySet<string> = (() => {
  try {
    return new Set(
      readdirSync(path.join(process.cwd(), "public", "images", "training"), {
        recursive: true,
      })
        .map(String)
        .filter((f) => f.endsWith(".svg"))
        .map((f) => f.slice(0, -4).split(path.sep).join("/")),
    );
  } catch {
    return new Set();
  }
})();

const artFor = (key: string): string | null =>
  ART.has(key) ? `/images/training/${key}.svg` : null;

export const lessonArt = (courseId: string, lessonId: string): string | null =>
  artFor(`${courseId}/${lessonId.replaceAll(".", "_")}`);
