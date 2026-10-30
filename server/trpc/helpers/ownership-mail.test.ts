/**
 * The handover notice reaches the old owner, the new one and every admin, each address once, even
 * when the old owner is an admin too or no longer belongs to the company.
 */
import { expect, test } from "bun:test";
import { noticeReaders } from "./ownership-mail";

const anna = { email: "anna@muster.example", locale: "de" };
const jan = { email: "jan@muster.example", locale: null };
const eva = { email: "eva@muster.example", locale: "en" };

test("each address once, the old and new owner first", () => {
  expect(
    noticeReaders([anna, jan], [jan, { ...anna, email: "ANNA@muster.example" }, eva]),
  ).toEqual([anna, jan, eva]);
});

test("an old owner who is gone is skipped, everyone else is told", () => {
  expect(noticeReaders([undefined, jan], [eva])).toEqual([jan, eva]);
});
