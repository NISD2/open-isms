import { describe, expect, test } from "bun:test";
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
    expect(buildCsp({ CSP_UPGRADE_INSECURE: "1" })).toContain("upgrade-insecure-requests");
  });

  test("directives never carry a blank source", () => {
    expect(buildCsp({})).not.toMatch(/\s{2,}/);
    expect(buildCsp({})).not.toMatch(/;\s*;/);
  });
});
