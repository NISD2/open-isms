import { describe, expect, test } from "bun:test";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  test("leaves plain text alone", () => {
    expect(csvCell("Risikomanagement")).toBe("Risikomanagement");
    expect(csvCell("")).toBe("");
    expect(csvCell("2026-09-30T00:00:00.000Z")).toBe("2026-09-30T00:00:00.000Z");
  });

  test("turns every formula start into text", () => {
    expect(csvCell('=HYPERLINK("https://evil.invalid")')).toBe(
      '"\'=HYPERLINK(""https://evil.invalid"")"',
    );
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+49 30 1234")).toBe("'+49 30 1234");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\t=1+1")).toBe("'\t=1+1");
  });

  test("quotes a leading carriage return as well as prefixing it", () => {
    expect(csvCell("\r=1+1")).toBe('"\'\r=1+1"');
  });

  test("only looks at the first character for formulas", () => {
    expect(csvCell("a=b")).toBe("a=b");
    expect(csvCell("mail@example.test")).toBe("mail@example.test");
  });

  test("quotes separators and doubles quotes", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("line\r\nbreak")).toBe('"line\r\nbreak"');
  });
});

describe("toCsv", () => {
  test("joins cells with commas and rows with CRLF", () => {
    expect(
      toCsv([
        ["id", "name"],
        ["A001", "=cmd|' /C calc'!A0"],
        ["A002", "ERP, Buchhaltung"],
      ]),
    ).toBe("id,name\r\nA001,'=cmd|' /C calc'!A0\r\nA002,\"ERP, Buchhaltung\"");
  });
});
