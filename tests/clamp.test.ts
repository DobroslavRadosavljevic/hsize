import { describe, expect, it } from "bun:test";

import { clamp } from "../src/index";

describe("clamp", () => {
  describe("basic clamping with min", () => {
    it("clamps value below min up to min", () => {
      // 500 KB < 1 MB, so result should be 1 MB in bytes (1048576)
      const result = clamp("500 KB", { min: "1 MB" });
      expect(result).toBe(1024 * 1024);
    });

    it("leaves value above min unchanged", () => {
      // 500 MB > 100 MB, so result should be 500 MB
      const result = clamp("500 MiB", { min: "100 MiB" });
      expect(result).toBe(500 * 1024 * 1024);
    });

    it("handles value exactly at min", () => {
      const result = clamp("100 MiB", { min: "100 MiB" });
      expect(result).toBe(100 * 1024 * 1024);
    });
  });

  describe("basic clamping with max", () => {
    it("clamps value above max down to max", () => {
      // 2 TiB > 1 GiB, so result should be 1 GiB in bytes
      const result = clamp("2 TiB", { max: "1 GiB" });
      expect(result).toBe(1024 * 1024 * 1024);
    });

    it("leaves value below max unchanged", () => {
      const result = clamp("500 MiB", { max: "1 GiB" });
      expect(result).toBe(500 * 1024 * 1024);
    });

    it("handles value exactly at max", () => {
      const result = clamp("1 GiB", { max: "1 GiB" });
      expect(result).toBe(1024 * 1024 * 1024);
    });
  });

  describe("clamping with both min and max", () => {
    it("clamps value below min up to min", () => {
      const result = clamp("50 MiB", { max: "1 GiB", min: "100 MiB" });
      expect(result).toBe(100 * 1024 * 1024);
    });

    it("clamps value above max down to max", () => {
      const result = clamp("2 GiB", { max: "1 GiB", min: "100 MiB" });
      expect(result).toBe(1024 * 1024 * 1024);
    });

    it("leaves value within range unchanged", () => {
      const result = clamp("500 MiB", { max: "1 GiB", min: "100 MiB" });
      expect(result).toBe(500 * 1024 * 1024);
    });
  });

  describe("format option", () => {
    it("returns formatted string when format: true", () => {
      const result = clamp("500 KB", { format: true, min: "1 MiB" });
      expect(result).toBe("1 MiB");
    });

    it("returns number when format: false", () => {
      const result = clamp("500 KB", { format: false, min: "1 MiB" });
      expect(result).toBe(1024 * 1024);
    });

    it("returns number when format is not specified", () => {
      const result = clamp("500 KB", { min: "1 MiB" });
      expect(typeof result).toBe("number");
    });

    it("respects system option when formatting", () => {
      const result = clamp("500 KB", {
        format: true,
        min: "1000000",
        system: "si",
      });
      expect(result).toBe("1 MB");
    });

    it("respects decimals option when formatting", () => {
      // decimals limits max decimal places, does not add padding zeros
      const result = clamp("1.5 MiB", {
        decimals: 0,
        format: true,
        min: "1 MiB",
      });
      expect(result).toBe("2 MiB");
    });

    it("respects space option when formatting", () => {
      const result = clamp("500 KB", {
        format: true,
        min: "1 MiB",
        space: false,
      });
      expect(result).toBe("1MiB");
    });

    it("respects longForm option when formatting", () => {
      const result = clamp("500 KB", {
        format: true,
        longForm: true,
        min: "1 MiB",
      });
      expect(result).toBe("1 mebibyte");
    });
  });

  describe("numeric inputs", () => {
    it("accepts numeric byte values for input", () => {
      const result = clamp(500, { min: 1000 });
      expect(result).toBe(1000);
    });

    it("accepts bigint byte values for input", () => {
      const result = clamp(500n, { min: 1000n });
      expect(result).toBe(1000);
    });

    it("accepts numeric values for min and max", () => {
      const result = clamp(500, { max: 1000, min: 100 });
      expect(result).toBe(500);
    });

    it("mixes string and numeric inputs", () => {
      const result = clamp("500 B", { min: 1000 });
      expect(result).toBe(1000);
    });

    it("handles large numeric values", () => {
      const result = clamp(1e15, { max: 1e12 });
      expect(result).toBe(1e12);
    });
  });

  describe("edge cases", () => {
    it("handles zero value", () => {
      const result = clamp(0, { min: 100 });
      expect(result).toBe(100);
    });

    it("handles zero min", () => {
      const result = clamp(50, { min: 0 });
      expect(result).toBe(50);
    });

    it("handles zero max", () => {
      const result = clamp(50, { max: 0 });
      expect(result).toBe(0);
    });

    it("handles no options", () => {
      const result = clamp("1 GiB");
      expect(result).toBe(1024 * 1024 * 1024);
    });

    it("handles no min or max specified", () => {
      const result = clamp("1 GiB", {});
      expect(result).toBe(1024 * 1024 * 1024);
    });

    it("handles format without min or max", () => {
      const result = clamp("1 GiB", { format: true });
      expect(result).toBe("1 GiB");
    });

    it("handles very small values", () => {
      const result = clamp(0.5, { min: 1 });
      expect(result).toBe(1);
    });
  });

  describe("error handling", () => {
    it("throws for non-finite input value", () => {
      expect(() => clamp(Number.NaN, { min: 100 })).toThrow(TypeError);
      expect(() => clamp(Number.POSITIVE_INFINITY, { min: 100 })).toThrow(
        TypeError
      );
    });

    it("throws for non-finite min value", () => {
      expect(() => clamp(100, { min: Number.NaN })).toThrow(TypeError);
      expect(() => clamp(100, { min: Number.POSITIVE_INFINITY })).toThrow(
        TypeError
      );
    });

    it("throws for non-finite max value", () => {
      expect(() => clamp(100, { max: Number.NaN })).toThrow(TypeError);
      expect(() => clamp(100, { max: Number.POSITIVE_INFINITY })).toThrow(
        TypeError
      );
    });

    it("throws for invalid string inputs", () => {
      expect(() => clamp("invalid")).toThrow();
    });

    it("throws for invalid min string", () => {
      expect(() => clamp(100, { min: "invalid" })).toThrow();
    });

    it("throws for invalid max string", () => {
      expect(() => clamp(100, { max: "invalid" })).toThrow();
    });
  });

  describe("unsafe bigint handling", () => {
    const a = 2n ** 80n + 1n;
    const b = 2n ** 80n + 2n;

    it("throws RangeError for out-of-safe-range bigint input or bounds", () => {
      expect(() => clamp(a)).toThrow(RangeError);
      expect(() => clamp(1n, { max: b })).toThrow(RangeError);
      expect(() => clamp(a, { max: b })).toThrow(RangeError);
    });
  });

  describe("examples from requirements", () => {
    it('clamp("500 KB", { min: "1 MB", max: "1 GB" }) returns 1MB in bytes', () => {
      const result = clamp("500 KB", { max: "1 GB", min: "1 MB" });
      // KB with uppercase is JEDEC (1024-based), so 1 MB = 1048576 bytes
      expect(result).toBe(1024 * 1024);
    });

    it('clamp("500 KB", { min: "1 MB", max: "1 GB", format: true }) returns "1 MiB"', () => {
      // Default system is IEC, so output will be MiB
      const result = clamp("500 KB", {
        format: true,
        max: "1 GB",
        min: "1 MB",
      });
      expect(result).toBe("1 MiB");
    });

    it('clamp("2 TB", { max: "1 GB" }) returns 1GB in bytes', () => {
      const result = clamp("2 TB", { max: "1 GB" });
      // TB and GB with uppercase are JEDEC (1024-based)
      expect(result).toBe(1024 * 1024 * 1024);
    });

    it('clamp("500 MB", { min: "100 MB" }) returns 500MB (unchanged)', () => {
      const result = clamp("500 MB", { min: "100 MB" });
      // 500 MB > 100 MB, so unchanged
      expect(result).toBe(500 * 1024 * 1024);
    });

    it('clamp("50 MB", { min: "100 MB", max: "1 GB" }) returns 100MB', () => {
      const result = clamp("50 MB", { max: "1 GB", min: "100 MB" });
      // 50 MB < 100 MB, so clamped to min
      expect(result).toBe(100 * 1024 * 1024);
    });
  });

  describe("combined options", () => {
    it("combines format with system option", () => {
      const result = clamp(500, { format: true, min: 1000, system: "si" });
      expect(result).toBe("1 kB");
    });

    it("combines format with bits option", () => {
      const result = clamp(64, { bits: true, format: true, min: 128 });
      expect(result).toBe("1 Kib");
    });

    it("combines format with unit option", () => {
      const result = clamp("500 KB", {
        format: true,
        min: "1 MiB",
        unit: "KiB",
      });
      expect(result).toBe("1024 KiB");
    });

    it("combines format with exponent option", () => {
      const result = clamp("500 KB", {
        exponent: 1,
        format: true,
        min: "1 MiB",
      });
      expect(result).toBe("1024 KiB");
    });

    it("combines format with signed option", () => {
      const result = clamp(500, { format: true, min: 1000, signed: true });
      expect(result).toBe("+1000 B");
    });

    it("combines format with pad option", () => {
      const result = clamp("500 KB", {
        decimals: 2,
        format: true,
        min: "1 MiB",
        pad: true,
      });
      expect(result).toBe("1.00 MiB");
    });
  });
});
