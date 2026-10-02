import { describe, expect, test } from "bun:test";
import { assetMfaMethodEnum } from "@nisd2/grc-data-model/enums";
import { MFA_METHODS } from "./types";

describe("the walk's lists mirror the database", () => {
  test("the sign-in methods are exactly the values asset.mfa_method accepts", () => {
    expect([...MFA_METHODS].sort()).toEqual([...assetMfaMethodEnum.enumValues].sort());
  });
});
