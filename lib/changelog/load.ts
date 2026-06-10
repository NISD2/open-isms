import raw from "@/data/changelog.json";
import { ChangelogSchema, type Changelog } from "./types";

export const changelog: Changelog = ChangelogSchema.parse(raw);
