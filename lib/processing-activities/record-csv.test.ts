import { describe, expect, test } from "bun:test";
import { recordCsv } from "./record-csv";

const BOM = "﻿";

describe("the record as a file", () => {
  test("keeps commas, quotes and line breaks inside their cell", () => {
    expect(recordCsv([["Payroll", 'Pay "wages", taxes\nand more', null]])).toBe(
      `${BOM}Payroll,"Pay ""wages"", taxes\nand more",\r\n`,
    );
  });

  test("writes one line per row", () => {
    expect(recordCsv([["a"], ["b"]]).split("\r\n")).toEqual([`${BOM}a`, "b", ""]);
  });

  test("opens a cell that starts like a formula as text", () => {
    // An activity's name is typed by a member; the person who opens the file may be an admin.
    expect(
      recordCsv([['=HYPERLINK("https://evil.invalid")', "+49 30 1234", "@SUM(A1)"]]),
    ).toBe(`${BOM}"'=HYPERLINK(""https://evil.invalid"")",'+49 30 1234,'@SUM(A1)\r\n`);
  });
});
