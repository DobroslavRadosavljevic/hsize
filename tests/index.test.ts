import { describe, expect, it } from "bun:test";

import { BYTE_PATTERN, GLOBAL_BYTE_PATTERN, format, parse } from "../src";

describe("format", () => {
  it("should convert bytes to human-readable string", () => {
    expect(format(0)).toBe("0 B");
  });
});

describe("parse", () => {
  it("should convert human-readable string to bytes", () => {
    expect(parse("0")).toBe(0);
  });
});

describe("exported patterns", () => {
  it("BYTE_PATTERN matches valid byte strings", () => {
    expect(BYTE_PATTERN.test("1 KB")).toBe(true);
    expect(BYTE_PATTERN.test("invalid")).toBe(false);
  });

  it("GLOBAL_BYTE_PATTERN finds all matches", () => {
    const text = "10 KB and 20 MB";
    const matches = text.match(GLOBAL_BYTE_PATTERN);
    expect(matches?.length).toBe(2);
  });
});
