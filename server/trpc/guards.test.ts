import { describe, expect, test } from "bun:test";
import { assertOwnObjectKey } from "./guards";

const OWN = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const prefix = `companies/${OWN}/training-certs/`;
// What getCertificateUploadUrl issued before audit F-4: the raw filename, backslash included.
const legacy = `${prefix}33333333-3333-4333-8333-333333333333-scan\\Zertifikat.pdf`;

describe("assertOwnObjectKey", () => {
  test("lets a record without a file, or with its file cleared, through", () => {
    expect(() => assertOwnObjectKey(prefix, undefined)).not.toThrow();
    expect(() => assertOwnObjectKey(prefix, null)).not.toThrow();
  });

  test("lets a key its upload path issues through", () => {
    expect(() => assertOwnObjectKey(prefix, `${prefix}x-cert.pdf`)).not.toThrow();
  });

  // The edit form sends the stored key back on every save.
  test("lets the key the record already holds through, even a legacy one", () => {
    expect(() => assertOwnObjectKey(prefix, legacy, legacy)).not.toThrow();
  });

  test("still refuses that legacy shape as a new key", () => {
    expect(() => assertOwnObjectKey(prefix, legacy)).toThrow();
    expect(() => assertOwnObjectKey(prefix, legacy, `${prefix}x-cert.pdf`)).toThrow();
  });

  test("refuses a new key that climbs out of the folder", () => {
    expect(() =>
      assertOwnObjectKey(prefix, `${prefix}../../${OTHER}/training-certs/x.pdf`, legacy),
    ).toThrow();
  });
});
