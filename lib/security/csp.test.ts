import { describe, expect, test } from "bun:test";
import { googleAdsTag } from "../analytics/google-ads-tag";
import { buildCsp, storageOrigin } from "./csp";

describe("storageOrigin", () => {
  test("a custom endpoint wins, reduced to its origin", () => {
    expect(storageOrigin({ AWS_S3_ENDPOINT: "http://localhost:9000" })).toBe(
      "http://localhost:9000",
    );
    expect(
      storageOrigin({ AWS_S3_ENDPOINT: "https://storage.example.com/evidence?x=1" }),
    ).toBe("https://storage.example.com");
  });

  test("a bucket without an endpoint implies the AWS virtual-host origin", () => {
    expect(storageOrigin({ AWS_S3_BUCKET: "mine", AWS_S3_REGION: "eu-central-1" })).toBe(
      "https://mine.s3.eu-central-1.amazonaws.com",
    );
  });

  // The bug this module exists for: an unconfigured instance used to inherit
  // the build machine's bucket, so every self-hoster advertised ours.
  test("nothing configured names nothing", () => {
    expect(storageOrigin({})).toBe("");
    expect(buildCsp({})).not.toContain("amazonaws.com");
    expect(buildCsp({})).toContain("connect-src 'self' https://accounts.google.com");
  });

  test("an unparseable endpoint does not leak into the policy", () => {
    expect(storageOrigin({ AWS_S3_ENDPOINT: "not a url" })).toBe("");
  });
});

describe("buildCsp", () => {
  test("the runtime storage origin reaches connect-src", () => {
    expect(buildCsp({ AWS_S3_ENDPOINT: "http://localhost:9000" })).toContain(
      "connect-src 'self' https://accounts.google.com http://localhost:9000",
    );
  });

  test("upgrade-insecure-requests only when the operator opts in", () => {
    expect(buildCsp({})).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ CSP_UPGRADE_INSECURE: "1" })).toContain(
      "upgrade-insecure-requests",
    );
  });

  test("cal.com may be framed but never runs a script on our origin", () => {
    const directives = buildCsp({}).split("; ");
    const scriptSrc = directives.find((d) => d.startsWith("script-src ")) ?? "";
    const frameSrc = directives.find((d) => d.startsWith("frame-src ")) ?? "";
    expect(scriptSrc).not.toContain("cal.com");
    expect(frameSrc.split(" ")).toContain("https://cal.com");
  });

  test("Google's measurement tag is allowed only where the operator set one", () => {
    const set = buildCsp({
      GOOGLE_ADS_TAG_ID: "AW-1234567890",
      GOOGLE_ADS_CONVERSION_LABEL: "aB3",
    });
    const scriptSrc = set.split("; ").find((d) => d.startsWith("script-src ")) ?? "";
    expect(scriptSrc).toContain("https://www.googletagmanager.com");
    expect(set).toContain("https://www.googleadservices.com");
    for (const unset of [
      {},
      { GOOGLE_ADS_TAG_ID: "AW-1234567890" },
      { GOOGLE_ADS_TAG_ID: "x" },
    ]) {
      const csp = buildCsp(unset);
      for (const origin of [
        "googletagmanager",
        "googleadservices",
        "doubleclick",
        "www.google.com",
      ]) {
        expect(csp).not.toContain(origin);
      }
    }
  });

  // The layout renders the tag from googleAdsConfig; the CSP opens Google from the same check, so a
  // value one of them rejects can never leave the other open.
  test("the CSP opens Google for exactly the values that render the tag", () => {
    const cases = [
      { GOOGLE_ADS_TAG_ID: "AW-123\n", GOOGLE_ADS_CONVERSION_LABEL: "aB3" },
      { GOOGLE_ADS_TAG_ID: "AW-abc", GOOGLE_ADS_CONVERSION_LABEL: "aB3" },
      { GOOGLE_ADS_TAG_ID: "AW-123", GOOGLE_ADS_CONVERSION_LABEL: "a b" },
      { GOOGLE_ADS_TAG_ID: "AW-123", GOOGLE_ADS_CONVERSION_LABEL: "" },
      { GOOGLE_ADS_TAG_ID: "AW-123", GOOGLE_ADS_CONVERSION_LABEL: "aB3" },
    ];
    for (const env of cases) {
      expect(buildCsp(env).includes("googletagmanager")).toBe(googleAdsTag(env) !== null);
    }
  });

  test("directives never carry a blank source", () => {
    expect(buildCsp({})).not.toMatch(/\s{2,}/);
    expect(buildCsp({})).not.toMatch(/;\s*;/);
  });
});
