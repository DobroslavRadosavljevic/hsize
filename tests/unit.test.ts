import { describe, expect, it } from "bun:test";

import { HSizeUnit, unit } from "../src/index";

describe("HSizeUnit (chainable)", () => {
  describe("construction", () => {
    it("creates from number", () => {
      const u = unit(1024);
      expect(u.bytes).toBe(1024);
    });

    it("creates from string", () => {
      const u = unit("1 KiB");
      expect(u.bytes).toBe(1024);
    });

    it("creates from BigInt", () => {
      const u = unit(1024n);
      expect(u.bytes).toBe(1024);
    });

    it("throws TypeError for invalid string input", () => {
      expect(() => unit("invalid")).toThrow(TypeError);
      expect(() => unit("invalid")).toThrow("Invalid byte value");
    });

    it("throws TypeError for NaN input", () => {
      expect(() => unit(Number.NaN)).toThrow(TypeError);
      expect(() => unit(Number.NaN)).toThrow("Invalid byte value");
    });

    it("throws TypeError for Infinity input", () => {
      expect(() => unit(Number.POSITIVE_INFINITY)).toThrow(TypeError);
      expect(() => unit(Number.NEGATIVE_INFINITY)).toThrow(TypeError);
    });
  });

  describe("arithmetic", () => {
    it("adds values", () => {
      const result = unit("1 KiB").add("512 B");
      expect(result.bytes).toBe(1536);
    });

    it("adds array of values", () => {
      const result = unit("1 KiB").add(["256 B", "256 B"]);
      expect(result.bytes).toBe(1536);
    });

    it("subtracts values", () => {
      const result = unit("1 KiB").subtract("512 B");
      expect(result.bytes).toBe(512);
    });

    it("multiplies values", () => {
      const result = unit("1 KiB").multiply(2);
      expect(result.bytes).toBe(2048);
    });

    it("multiplies by array", () => {
      const result = unit("1 KiB").multiply([2, 2]);
      expect(result.bytes).toBe(4096);
    });

    it("divides values", () => {
      const result = unit("1 KiB").divide(2);
      expect(result.bytes).toBe(512);
    });

    it("chains operations", () => {
      const result = unit("1 MiB").add("512 KiB").multiply(2).divide(4);
      expect(result.bytes).toBe(786_432);
    });
  });

  describe("conversion", () => {
    it("converts to specific unit", () => {
      const result = unit(1_048_576).to("KiB");
      expect(result).toBe("1024 KiB");
    });

    it("converts to SI", () => {
      const result = unit(1_000_000).toSI();
      expect(result).toBe("1 MB");
    });

    it("converts to IEC", () => {
      const result = unit(1_048_576).toIEC();
      expect(result).toBe("1 MiB");
    });

    it("converts to JEDEC", () => {
      const result = unit(1_048_576).toJEDEC();
      expect(result).toBe("1 MB");
    });

    it("converts to bits", () => {
      const result = unit(1024).toBits();
      expect(result).toBe("8 Kib");
    });
  });

  describe("standard methods", () => {
    it("valueOf returns bytes", () => {
      const u = unit(1024);
      expect(u.valueOf()).toBe(1024);
      expect(+u).toBe(1024);
    });

    it("toString returns formatted string", () => {
      const u = unit(1024);
      expect(u.toString()).toBe("1 KiB");
    });

    it("toJSON returns object", () => {
      const u = unit(1024);
      const json = u.toJSON();
      expect(json.bytes).toBe(1024);
      expect(json.value).toBe(1);
      expect(json.unit).toBe("KiB");
    });
  });

  describe("HSizeUnit class", () => {
    it("can be instantiated directly", () => {
      const u = new HSizeUnit(1024);
      expect(u.bytes).toBe(1024);
    });
  });

  describe("arithmetic edge cases", () => {
    it("divide by zero throws TypeError", () => {
      expect(() => unit(1024).divide(0)).toThrow(TypeError);
      expect(() => unit(1024).divide(0)).toThrow("Division by zero");
    });

    it("divide by array containing zero throws TypeError", () => {
      expect(() => unit(1024).divide([2, 0, 2])).toThrow(TypeError);
      expect(() => unit(1024).divide([2, 0, 2])).toThrow("Division by zero");
    });

    it("handles negative results from subtraction", () => {
      const result = unit("512 B").subtract("1 KiB");
      expect(result.bytes).toBe(-512);
    });

    it("chains mixed input types (string, number, BigInt)", () => {
      const result = unit("1 KiB").add(512).multiply(2);
      expect(result.bytes).toBe(3072);
    });

    it("operates at extreme scales (bytes to yottabytes)", () => {
      const huge = unit(1e24);
      const added = huge.add(1e23);
      expect(added.bytes).toBe(1.1e24);
    });

    it("handles very small values after division", () => {
      const result = unit(1).divide(1000);
      expect(result.bytes).toBe(0.001);
    });

    it("multiplies by zero", () => {
      const result = unit(1024).multiply(0);
      expect(result.bytes).toBe(0);
    });

    it("divides by array of values sequentially", () => {
      const result = unit(1024).divide([2, 2, 2]);
      expect(result.bytes).toBe(128);
    });

    it("subtracts array of values", () => {
      const result = unit("2 KiB").subtract(["512 B", "512 B"]);
      expect(result.bytes).toBe(1024);
    });
  });

  describe("precision edge cases", () => {
    it("maintains precision in chained operations", () => {
      const result = unit(1000).multiply(3).divide(3);
      expect(result.bytes).toBe(1000);
    });

    it("handles floating point in chained multiply/divide", () => {
      const result = unit(100).multiply(0.1).multiply(10);
      expect(result.bytes).toBe(100);
    });
  });

  describe("input validation", () => {
    it("multiply throws TypeError for NaN input", () => {
      expect(() => unit(1024).multiply(Number.NaN)).toThrow(TypeError);
      expect(() => unit(1024).multiply(Number.NaN)).toThrow(
        "Expected finite number"
      );
    });

    it("multiply throws TypeError for Infinity input", () => {
      expect(() => unit(1024).multiply(Number.POSITIVE_INFINITY)).toThrow(
        TypeError
      );
      expect(() => unit(1024).multiply(Number.NEGATIVE_INFINITY)).toThrow(
        TypeError
      );
    });

    it("multiply throws TypeError for non-finite values in array", () => {
      expect(() => unit(1024).multiply([2, Number.NaN, 3])).toThrow(TypeError);
      expect(() => unit(1024).multiply([2, Number.POSITIVE_INFINITY])).toThrow(
        TypeError
      );
    });

    it("divide throws TypeError for NaN input", () => {
      expect(() => unit(1024).divide(Number.NaN)).toThrow(TypeError);
      expect(() => unit(1024).divide(Number.NaN)).toThrow(
        "Expected finite number"
      );
    });

    it("divide throws TypeError for Infinity input", () => {
      expect(() => unit(1024).divide(Number.POSITIVE_INFINITY)).toThrow(
        TypeError
      );
      expect(() => unit(1024).divide(Number.NEGATIVE_INFINITY)).toThrow(
        TypeError
      );
    });

    it("divide throws TypeError for non-finite values in array", () => {
      expect(() => unit(1024).divide([2, Number.NaN, 3])).toThrow(TypeError);
      expect(() => unit(1024).divide([2, Number.POSITIVE_INFINITY])).toThrow(
        TypeError
      );
    });
  });

  describe("to() and toString() with options", () => {
    it("accepts format options in to() method", () => {
      const result = unit(1536).to("KiB", { decimals: 3 });
      expect(result).toBe("1.5 KiB");
    });

    it("accepts format options in toString()", () => {
      const u = unit(1536);
      expect(u.toString({ decimals: 3 })).toBe("1.5 KiB");
    });
  });
});
