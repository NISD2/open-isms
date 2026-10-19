import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REQUIREMENT_PARTS, requirementsEn } from "@/i18n/requirements";
import { getRequirementsMessages, getRequirementTitle } from "./messages";

const ROOT = join(import.meta.dir, "..", "messages", "requirements");

type PartFile = { readonly requirements: Readonly<Record<string, unknown>> };

const read = (part: string, file: string): PartFile =>
  JSON.parse(readFileSync(join(ROOT, part, file), "utf8"));

const partDirs = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

describe("the requirement copy in parts", () => {
  test("every part directory is a known part, and every known part has a directory", () => {
    expect(partDirs).toEqual([...REQUIREMENT_PARTS].sort());
  });

  test("the English bundle holds exactly the keys of the English part files", () => {
    const fromFiles = partDirs.flatMap((part) =>
      Object.keys(read(part, "en.json").requirements),
    );
    expect(Object.keys(requirementsEn.requirements).sort()).toEqual(fromFiles.sort());
  });

  test("no requirement code sits in two parts", () => {
    const codes = partDirs.flatMap((part) =>
      Object.keys(read(part, "en.json").requirements),
    );
    expect(new Set(codes).size).toBe(codes.length);
  });

  test("a language's part holds only keys its English part has", () => {
    const stray = partDirs.flatMap((part) => {
      const english = new Set(Object.keys(read(part, "en.json").requirements));
      return readdirSync(join(ROOT, part))
        .filter((file) => file !== "en.json")
        .flatMap((file) =>
          Object.keys(read(part, file).requirements)
            .filter((key) => !english.has(key))
            .map((key) => `${part}/${file}: ${key}`),
        );
    });
    expect(stray).toEqual([]);
  });
});

describe("getRequirementsMessages", () => {
  test("reads a language from its parts", async () => {
    const german = await getRequirementsMessages("de");
    const expected = read("nis2", "de.json").requirements["1_1"] as { title: string };
    expect(getRequirementTitle(german, "1.1")).toBe(expected.title);
  });

  test("fills a part a language does not have from English, and keeps the parts it has", async () => {
    const spanish = await getRequirementsMessages("es");
    const ownTitle = read("nis2", "es.json").requirements["1_1"] as { title: string };
    expect(getRequirementTitle(spanish, "1.1")).toBe(ownTitle.title);
    expect(getRequirementTitle(spanish, "AI-LIT.1")).toBe(
      getRequirementTitle(requirementsEn, "AI-LIT.1"),
    );
  });

  test("falls back to the code for an unknown requirement", () => {
    expect(getRequirementTitle(requirementsEn, "9.99")).toBe("9.99");
  });
});
