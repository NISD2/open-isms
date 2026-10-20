import { describe, expect, test } from "bun:test";
import { personFieldsOf, WALKS } from "./index";

describe("the roles the walks name a person for", () => {
  test("are the NIS 2 incident lead and the GDPR walk's DPO, breach lead and request handler", () => {
    const roles = Object.values(WALKS).flatMap((walk) =>
      personFieldsOf(walk).map(({ code, field }) => `${code} ${field}`),
    );
    expect(roles).toEqual([
      "3.1 incidentLead",
      "G-DPO.1 dpoName",
      "G-BRC.1 breachLead",
      "G-DSR.1 requestHandler",
    ]);
  });
});
