import { expect, test } from "bun:test";
import { contactSuggestions } from "./suggest";

test("offers a security@ address, a security.txt file and the contact itself, at its domain", () => {
  expect(contactSuggestions(" Info@Muster-GmbH.example ")).toEqual([
    "security@muster-gmbh.example",
    "https://muster-gmbh.example/.well-known/security.txt",
    "info@muster-gmbh.example",
  ]);
});

test("offers nothing without a contact email or a domain in it", () => {
  expect(contactSuggestions(null)).toEqual([]);
  expect(contactSuggestions("")).toEqual([]);
  expect(contactSuggestions("info@")).toEqual([]);
});
