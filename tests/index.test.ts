import { describe, expect, it } from "bun:test";

import { format, parse } from "../src";

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
