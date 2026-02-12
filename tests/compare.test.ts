import { describe, expect, it } from "bun:test";

import { between, eq, gt, gte, lt, lte, max, min } from "../src/index";

describe("compare", () => {
  describe("gt (greater than)", () => {
    it("compares numbers", () => {
      expect(gt(2000, 1000)).toBe(true);
      expect(gt(1000, 2000)).toBe(false);
      expect(gt(1000, 1000)).toBe(false);
    });

    it("compares strings", () => {
      expect(gt("2 GB", "1 GB")).toBe(true);
      expect(gt("500 MB", "1 GB")).toBe(false);
      expect(gt("1 KiB", "1 KiB")).toBe(false);
    });

    it("compares mixed types", () => {
      expect(gt("1 MiB", 1000)).toBe(true);
      expect(gt(1024, "1 KiB")).toBe(false);
      expect(gt("2 KiB", 1024)).toBe(true);
    });

    it("compares bigints", () => {
      expect(gt(2000n, 1000)).toBe(true);
      expect(gt(1000, 2000n)).toBe(false);
      expect(gt(1024n, "1 KiB")).toBe(false);
    });

    it("handles different unit systems", () => {
      // Note: uppercase "GB" is JEDEC (1024-based), same as GiB
      // 1 GiB === 1 GB (equal values)
      expect(gt("1 GiB", "1 GB")).toBe(false);
      // 1 GiB > 1 kB (SI)
      expect(gt("1 GiB", "1 kB")).toBe(true);
      // 1000 < 1024
      expect(gt("1 kB", "1 KiB")).toBe(false);
    });
  });

  describe("gte (greater than or equal)", () => {
    it("compares numbers", () => {
      expect(gte(2000, 1000)).toBe(true);
      expect(gte(1000, 2000)).toBe(false);
      expect(gte(1000, 1000)).toBe(true);
    });

    it("compares strings", () => {
      expect(gte("2 GB", "1 GB")).toBe(true);
      expect(gte("500 MB", "1 GB")).toBe(false);
      expect(gte("1 KiB", "1 KiB")).toBe(true);
    });

    it("compares equivalent values in different formats", () => {
      expect(gte(1024, "1 KiB")).toBe(true);
      expect(gte("1024 B", "1 KiB")).toBe(true);
    });

    it("handles bigints", () => {
      expect(gte(1024n, "1 KiB")).toBe(true);
      expect(gte(1000n, 1000)).toBe(true);
    });
  });

  describe("lt (less than)", () => {
    it("compares numbers", () => {
      expect(lt(1000, 2000)).toBe(true);
      expect(lt(2000, 1000)).toBe(false);
      expect(lt(1000, 1000)).toBe(false);
    });

    it("compares strings", () => {
      expect(lt("500 MB", "1 GB")).toBe(true);
      expect(lt("2 GB", "1 GB")).toBe(false);
      expect(lt("1 KiB", "1 KiB")).toBe(false);
    });

    it("compares mixed types", () => {
      expect(lt(500, "1 KiB")).toBe(true);
      expect(lt("512 B", 1024)).toBe(true);
    });

    it("handles bigints", () => {
      expect(lt(500n, 1000)).toBe(true);
      expect(lt(1000, 500n)).toBe(false);
    });
  });

  describe("lte (less than or equal)", () => {
    it("compares numbers", () => {
      expect(lte(1000, 2000)).toBe(true);
      expect(lte(2000, 1000)).toBe(false);
      expect(lte(1000, 1000)).toBe(true);
    });

    it("compares strings", () => {
      expect(lte("500 MB", "1 GB")).toBe(true);
      expect(lte("2 GB", "1 GB")).toBe(false);
      expect(lte("1 KiB", "1 KiB")).toBe(true);
    });

    it("compares equivalent values in different formats", () => {
      expect(lte(1024, "1 KiB")).toBe(true);
      expect(lte("1024 B", "1 KiB")).toBe(true);
    });
  });

  describe("eq (equal)", () => {
    it("compares equal numbers", () => {
      expect(eq(1000, 1000)).toBe(true);
      expect(eq(1000, 2000)).toBe(false);
    });

    it("compares equal strings", () => {
      expect(eq("1 KiB", "1 KiB")).toBe(true);
      expect(eq("1 KiB", "2 KiB")).toBe(false);
    });

    it("compares equivalent values in different formats", () => {
      expect(eq("1 KiB", 1024)).toBe(true);
      expect(eq("1024 B", "1 KiB")).toBe(true);
      expect(eq(1024, "1024 B")).toBe(true);
    });

    it("handles different unit systems", () => {
      // Note: uppercase "GB" is JEDEC (1024-based), same as GiB
      // Both are 1024^3
      expect(eq("1 GB", "1 GiB")).toBe(true);
      // 1000 vs 1024
      expect(eq("1 kB", "1 KiB")).toBe(false);
      expect(eq("1024 MiB", "1 GiB")).toBe(true);
    });

    it("handles bigints", () => {
      expect(eq(1024n, 1024)).toBe(true);
      expect(eq(1024n, "1 KiB")).toBe(true);
    });
  });

  describe("between", () => {
    it("checks if value is in range with numbers", () => {
      expect(between(500, 0, 1000)).toBe(true);
      expect(between(1500, 0, 1000)).toBe(false);
      expect(between(-100, 0, 1000)).toBe(false);
    });

    it("checks if value is in range with strings", () => {
      expect(between("500 MB", "100 MB", "1 GB")).toBe(true);
      expect(between("2 GB", "100 MB", "1 GB")).toBe(false);
      expect(between("50 MB", "100 MB", "1 GB")).toBe(false);
    });

    it("includes boundaries (inclusive)", () => {
      expect(between(0, 0, 1000)).toBe(true);
      expect(between(1000, 0, 1000)).toBe(true);
      expect(between("1 KiB", "1 KiB", "2 KiB")).toBe(true);
      expect(between("2 KiB", "1 KiB", "2 KiB")).toBe(true);
    });

    it("handles mixed types", () => {
      expect(between(1024, 0, "2 KiB")).toBe(true);
      expect(between("1.5 KiB", 1024, 2048)).toBe(true);
    });

    it("handles bigints", () => {
      expect(between(500n, 0, 1000)).toBe(true);
      expect(between(1024, 0n, "2 KiB")).toBe(true);
    });
  });

  describe("min", () => {
    it("finds minimum of numbers", () => {
      expect(min(1000, 500, 2000)).toBe(500);
      expect(min(100)).toBe(100);
    });

    it("finds minimum of strings", () => {
      expect(min("1 GB", "500 MB", "2 GB")).toBe(524_288_000);
      expect(min("1 KiB", "512 B", "2 KiB")).toBe(512);
    });

    it("finds minimum of mixed types", () => {
      expect(min(1024, "2 KiB", 512)).toBe(512);
      expect(min("1 MiB", 500_000, "2 MiB")).toBe(500_000);
    });

    it("handles single value", () => {
      expect(min("1 MiB")).toBe(1_048_576);
      expect(min(1024)).toBe(1024);
    });

    it("throws error for empty arguments", () => {
      expect(() => min()).toThrow("min requires at least one argument");
    });

    it("handles bigints", () => {
      expect(min(1000n, 500, 2000)).toBe(500);
      expect(min(1024n, "512 B")).toBe(512);
    });
  });

  describe("max", () => {
    it("finds maximum of numbers", () => {
      expect(max(1000, 500, 2000)).toBe(2000);
      expect(max(100)).toBe(100);
    });

    it("finds maximum of strings", () => {
      expect(max("1 GB", "500 MB", "2 GB")).toBe(2_147_483_648);
      expect(max("1 KiB", "512 B", "2 KiB")).toBe(2048);
    });

    it("finds maximum of mixed types", () => {
      expect(max(1024, "2 KiB", 512)).toBe(2048);
      expect(max("1 MiB", 500_000, "2 MiB")).toBe(2_097_152);
    });

    it("handles single value", () => {
      expect(max("1 MiB")).toBe(1_048_576);
      expect(max(1024)).toBe(1024);
    });

    it("throws error for empty arguments", () => {
      expect(() => max()).toThrow("max requires at least one argument");
    });

    it("handles bigints", () => {
      expect(max(1000n, 500, 2000)).toBe(2000);
      expect(max(1024n, "2 KiB")).toBe(2048);
    });
  });

  describe("edge cases", () => {
    it("handles zero values", () => {
      expect(gt(0, 0)).toBe(false);
      expect(gte(0, 0)).toBe(true);
      expect(lt(0, 0)).toBe(false);
      expect(lte(0, 0)).toBe(true);
      expect(eq(0, 0)).toBe(true);
      expect(between(0, 0, 0)).toBe(true);
      expect(min(0, 1, 2)).toBe(0);
      expect(max(0, 1, 2)).toBe(2);
    });

    it("handles negative values", () => {
      expect(gt(-100, -200)).toBe(true);
      expect(lt(-200, -100)).toBe(true);
      expect(eq(-100, -100)).toBe(true);
      expect(between(-150, -200, -100)).toBe(true);
      expect(min(-100, -200, 0)).toBe(-200);
      expect(max(-100, -200, 0)).toBe(0);
    });

    it("handles decimal string values", () => {
      expect(gt("1.5 KiB", "1 KiB")).toBe(true);
      expect(eq("1.5 KiB", 1536)).toBe(true);
      expect(between("1.5 KiB", "1 KiB", "2 KiB")).toBe(true);
    });

    it("handles large values", () => {
      expect(gt("1 TiB", "1 GiB")).toBe(true);
      expect(eq("1 TiB", 1_099_511_627_776)).toBe(true);
    });
  });

  describe("unsafe bigint handling", () => {
    const a = 2n ** 80n + 1n;
    const b = 2n ** 80n + 2n;

    it("throws RangeError for comparisons with out-of-safe-range bigint", () => {
      expect(() => eq(a, b)).toThrow(RangeError);
      expect(() => gt(a, b)).toThrow(RangeError);
      expect(() => between(a, 0, b)).toThrow(RangeError);
    });

    it("throws RangeError for min/max with out-of-safe-range bigint", () => {
      expect(() => min(a, b)).toThrow(RangeError);
      expect(() => max(a, b)).toThrow(RangeError);
    });
  });
});
