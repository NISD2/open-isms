import { describe, expect, test } from "bun:test";
import { companyUploadFolders, isOwnObjectKey, sanitizeFilename } from "./object-key";

const OWN = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const prefix = `supplier-certifications/${OWN}/`;

// Erasure deletes a torn-down company's files by these folders, so a folder
// that reached past the company, or into the invoice archive, would delete
// someone else's files.
describe("companyUploadFolders", () => {
  test("every folder is the company's own, closed with a slash", () => {
    const folders = companyUploadFolders(OWN);
    expect(folders.length).toBeGreaterThan(0);
    for (const folder of folders) {
      expect(folder.includes(`/${OWN}/`)).toBe(true);
      expect(folder.endsWith("/")).toBe(true);
    }
    expect(companyUploadFolders(OTHER).some((f) => f.includes(OWN))).toBe(false);
  });

  test("leaves the invoice archive alone", () => {
    expect(companyUploadFolders(OWN).some((f) => f.startsWith("billing/"))).toBe(false);
  });
});

describe("isOwnObjectKey", () => {
  test("accepts a key its upload path issues", () => {
    expect(isOwnObjectKey(prefix, `${prefix}1759219200000-iso27001.pdf`)).toBe(true);
  });

  test("accepts a sanitized name that starts with dots, since it cannot climb", () => {
    const name = sanitizeFilename("../../etc/passwd");
    expect(isOwnObjectKey(prefix, `${prefix}1759219200000-${name}`)).toBe(true);
  });

  test("refuses another company's folder", () => {
    expect(
      isOwnObjectKey(prefix, `supplier-certifications/${OTHER}/1759219200000-a.pdf`),
    ).toBe(false);
  });

  test("refuses another upload path's folder for the same company", () => {
    expect(isOwnObjectKey(prefix, `evidence/${OWN}/x/a.pdf`)).toBe(false);
  });

  // The case a bare startsWith let through.
  test("refuses a dot-dot segment that climbs out of the folder", () => {
    expect(isOwnObjectKey(prefix, `${prefix}../${OTHER}/a.pdf`)).toBe(false);
    expect(isOwnObjectKey(prefix, `${prefix}sub/../../${OTHER}/a.pdf`)).toBe(false);
  });

  test("refuses a single-dot segment", () => {
    expect(isOwnObjectKey(prefix, `${prefix}./a.pdf`)).toBe(false);
  });

  test("refuses a backslash, which some stores read as a separator", () => {
    expect(isOwnObjectKey(prefix, `${prefix}..\\${OTHER}\\a.pdf`)).toBe(false);
    expect(isOwnObjectKey(prefix, `${prefix}a\\b.pdf`)).toBe(false);
  });

  test("refuses a leading slash", () => {
    expect(isOwnObjectKey(prefix, `/${prefix}a.pdf`)).toBe(false);
  });

  test("refuses empty segments and the bare folder", () => {
    expect(isOwnObjectKey(prefix, `${prefix}/a.pdf`)).toBe(false);
    expect(isOwnObjectKey(prefix, `${prefix}sub/`)).toBe(false);
    expect(isOwnObjectKey(prefix, prefix)).toBe(false);
  });

  test("fails closed on a prefix without its trailing slash", () => {
    expect(
      isOwnObjectKey(`supplier-certifications/${OWN}`, `${prefix}1759219200000-a.pdf`),
    ).toBe(false);
  });
});
