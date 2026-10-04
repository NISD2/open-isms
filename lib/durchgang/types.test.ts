import { describe, expect, test } from "bun:test";
import { assetHostingEnum, assetMfaMethodEnum } from "@nisd2/grc-data-model/enums";
import { HOSTINGS, MFA_METHODS } from "./types";

describe("the walk's lists mirror the database", () => {
  test("the sign-in methods are exactly the values asset.mfa_method accepts", () => {
    expect([...MFA_METHODS].sort()).toEqual([...assetMfaMethodEnum.enumValues].sort());
  });

  test("where an asset runs is exactly the values asset.hosting accepts", () => {
    expect([...HOSTINGS].sort()).toEqual([...assetHostingEnum.enumValues].sort());
  });
});
