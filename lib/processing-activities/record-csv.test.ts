import { describe, expect, test } from "bun:test";
import { recordCsv } from "./record-csv";

describe("the record as a file", () => {
  test("keeps commas, quotes and line breaks inside their cell", () => {
    expect(recordCsv([["Payroll", 'Pay "wages", taxes\nand more', null]])).toBe(
      '﻿"Payroll","Pay ""wages"", taxes\nand more",""\r\n',
    );
  });

  test("writes one line per row", () => {
    expect(recordCsv([["a"], ["b"]]).split("\r\n")).toEqual(['﻿"a"', '"b"', ""]);
  });
});
