import { describe, expect, it } from "bun:test";

import { isBytes, isParsable, isUnit } from "../src/index";

describe("isBytes", () => {
  it("returns true for valid byte strings", () => {
    expect(isBytes("1 KB")).toBe(true);
    expect(isBytes("1.5 GiB")).toBe(true);
    expect(isBytes("100")).toBe(true);
    expect(isBytes("-50 MB")).toBe(true);
  });

  it("returns true for various unit formats", () => {
    expect(isBytes("1 B")).toBe(true);
    expect(isBytes("1 b")).toBe(true);
    expect(isBytes("1 bytes")).toBe(true);
    expect(isBytes("1 byte")).toBe(true);
    expect(isBytes("1 KiB")).toBe(true);
    expect(isBytes("1 MiB")).toBe(true);
    expect(isBytes("1 kB")).toBe(true);
  });

  it("returns true for values without units", () => {
    expect(isBytes("100")).toBe(true);
    expect(isBytes("1.5")).toBe(true);
    expect(isBytes("-100")).toBe(true);
  });

  it("returns true for values with scientific notation", () => {
    expect(isBytes("1e6 B")).toBe(true);
    expect(isBytes("1.5e3 KB")).toBe(true);
    expect(isBytes("1e+6 MB")).toBe(true);
    expect(isBytes("1e-3 B")).toBe(true);
  });

  it("returns false for invalid strings", () => {
    expect(isBytes("hello")).toBe(false);
    expect(isBytes("")).toBe(false);
    expect(isBytes("KB")).toBe(false);
    expect(isBytes("abc123")).toBe(false);
  });

  it("returns false for non-string inputs", () => {
    expect(isBytes(123 as unknown as string)).toBe(false);
    expect(isBytes(null as unknown as string)).toBe(false);
    expect(isBytes(undefined as unknown as string)).toBe(false);
    expect(isBytes({} as unknown as string)).toBe(false);
  });

  it("handles whitespace correctly", () => {
    expect(isBytes("  1 KB  ")).toBe(true);
    expect(isBytes("1KB")).toBe(true);
    expect(isBytes("   ")).toBe(false);
  });
});

describe("isUnit", () => {
  it("returns true for valid IEC units", () => {
    expect(isUnit("B")).toBe(true);
    expect(isUnit("KiB")).toBe(true);
    expect(isUnit("MiB")).toBe(true);
    expect(isUnit("GiB")).toBe(true);
    expect(isUnit("TiB")).toBe(true);
    expect(isUnit("PiB")).toBe(true);
    expect(isUnit("EiB")).toBe(true);
    expect(isUnit("ZiB")).toBe(true);
    expect(isUnit("YiB")).toBe(true);
  });

  it("returns true for valid SI units", () => {
    expect(isUnit("B")).toBe(true);
    expect(isUnit("kB")).toBe(true);
    expect(isUnit("KB")).toBe(true);
    expect(isUnit("MB")).toBe(true);
    expect(isUnit("GB")).toBe(true);
    expect(isUnit("TB")).toBe(true);
  });

  it("returns true for bit units", () => {
    expect(isUnit("b")).toBe(true);
    expect(isUnit("Kib")).toBe(true);
    expect(isUnit("Mib")).toBe(true);
    expect(isUnit("kb")).toBe(true);
  });

  it("returns true for long form units", () => {
    expect(isUnit("bytes")).toBe(true);
    expect(isUnit("byte")).toBe(true);
    expect(isUnit("bits")).toBe(true);
    expect(isUnit("bit")).toBe(true);
  });

  it("returns false for invalid units", () => {
    expect(isUnit("xyz")).toBe(false);
    expect(isUnit("123")).toBe(false);
    expect(isUnit("")).toBe(false);
    expect(isUnit("abc")).toBe(false);
    expect(isUnit("notaunit")).toBe(false);
  });

  it("handles case insensitivity", () => {
    expect(isUnit("BYTES")).toBe(true);
    expect(isUnit("Bytes")).toBe(true);
    expect(isUnit("kib")).toBe(true);
    expect(isUnit("KIB")).toBe(true);
  });

  it("returns false for non-string inputs", () => {
    expect(isUnit(123 as unknown as string)).toBe(false);
    expect(isUnit(null as unknown as string)).toBe(false);
    expect(isUnit(undefined as unknown as string)).toBe(false);
  });

  it("handles whitespace correctly", () => {
    expect(isUnit("  KB  ")).toBe(true);
    expect(isUnit("   ")).toBe(false);
  });
});

describe("isParsable valid inputs", () => {
  it("returns true for valid byte strings", () => {
    expect(isParsable("1 KB")).toBe(true);
    expect(isParsable("1.5 GiB")).toBe(true);
    expect(isParsable("100")).toBe(true);
  });

  it("returns true for finite numbers", () => {
    expect(isParsable(1024)).toBe(true);
    expect(isParsable(0)).toBe(true);
    expect(isParsable(-500)).toBe(true);
    expect(isParsable(1.5)).toBe(true);
  });

  it("returns true for BigInt values", () => {
    expect(isParsable(1024n)).toBe(true);
    expect(isParsable(0n)).toBe(true);
    expect(isParsable(-500n)).toBe(true);
    expect(isParsable(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toBe(true);
  });
});

describe("isParsable invalid inputs", () => {
  it("returns false for non-parsable strings", () => {
    expect(isParsable("hello")).toBe(false);
    expect(isParsable("")).toBe(false);
    expect(isParsable("abc")).toBe(false);
  });

  it("returns false for NaN and Infinity", () => {
    expect(isParsable(Number.NaN)).toBe(false);
    expect(isParsable(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isParsable(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("returns false for objects and arrays", () => {
    expect(isParsable({})).toBe(false);
    expect(isParsable([])).toBe(false);
    expect(isParsable({ value: 1024 })).toBe(false);
  });

  it("returns false for null and undefined", () => {
    expect(isParsable(null)).toBe(false);
    expect(isParsable()).toBe(false);
  });

  it("returns false for other types", () => {
    expect(isParsable(() => 1024)).toBe(false);
    expect(isParsable(Symbol("test"))).toBe(false);
    expect(isParsable(true)).toBe(false);
    expect(isParsable(false)).toBe(false);
  });
});
