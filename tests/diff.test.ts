import { describe, expect, it } from "bun:test";

import { diff } from "../src/index";

describe("diff", () => {
  describe("basic differences", () => {
    it("calculates positive difference", () => {
      // Using IEC units for clear expectations
      expect(diff("1 GiB", "1.5 GiB")).toBe("+512 MiB");
    });

    it("calculates negative difference", () => {
      expect(diff("2 GiB", "1 GiB")).toBe("-1 GiB");
    });

    it("calculates zero difference", () => {
      expect(diff("1 GiB", "1 GiB")).toBe("0 B");
    });

    it("handles small positive difference", () => {
      expect(diff("1 KiB", "2 KiB")).toBe("+1 KiB");
    });

    it("handles small negative difference", () => {
      expect(diff("2 KiB", "1 KiB")).toBe("-1 KiB");
    });
  });

  describe("signed option", () => {
    it("shows sign by default", () => {
      expect(diff("1 GiB", "1.5 GiB")).toBe("+512 MiB");
      expect(diff("1.5 GiB", "1 GiB")).toBe("-512 MiB");
    });

    it("hides sign when signed: false", () => {
      expect(diff("1 GiB", "1.5 GiB", { signed: false })).toBe("512 MiB");
      expect(diff("1.5 GiB", "1 GiB", { signed: false })).toBe("512 MiB");
    });

    it("does not add sign to zero with signed: true", () => {
      expect(diff("1 GiB", "1 GiB", { signed: true })).toBe("0 B");
    });
  });

  describe("percentage option", () => {
    it("includes percentage when percentage: true", () => {
      expect(diff("1 GiB", "1.5 GiB", { percentage: true })).toBe(
        "+512 MiB (+50%)"
      );
    });

    it("shows 100% increase", () => {
      expect(diff("1 GiB", "2 GiB", { percentage: true })).toBe(
        "+1 GiB (+100%)"
      );
    });

    it("shows negative percentage", () => {
      expect(diff("2 GiB", "1 GiB", { percentage: true })).toBe(
        "-1 GiB (-50%)"
      );
    });

    it("shows 0% for no change", () => {
      expect(diff("1 GiB", "1 GiB", { percentage: true })).toBe("0 B (0%)");
    });

    it("handles percentage with signed: false", () => {
      expect(
        diff("1 GiB", "1.5 GiB", { percentage: true, signed: false })
      ).toBe("512 MiB (50%)");
    });

    it("handles negative percentage with signed: false", () => {
      expect(diff("2 GiB", "1 GiB", { percentage: true, signed: false })).toBe(
        "1 GiB (50%)"
      );
    });
  });

  describe("numeric inputs", () => {
    it("accepts numeric byte values", () => {
      expect(diff(1024, 2048)).toBe("+1 KiB");
    });

    it("accepts bigint byte values", () => {
      expect(diff(1024n, 2048n)).toBe("+1 KiB");
    });

    it("mixes string and numeric inputs", () => {
      expect(diff("1 KiB", 2048)).toBe("+1 KiB");
      expect(diff(1024, "2 KiB")).toBe("+1 KiB");
    });

    it("handles large numeric differences", () => {
      expect(diff(0, 1_073_741_824)).toBe("+1 GiB");
    });
  });

  describe("format options", () => {
    it("respects system option", () => {
      expect(diff(0, 1000, { system: "si" })).toBe("+1 kB");
      expect(diff(0, 1024, { system: "iec" })).toBe("+1 KiB");
      expect(diff(0, 1024, { system: "jedec" })).toBe("+1 KB");
    });

    it("respects decimals option", () => {
      expect(diff(0, 1536, { decimals: 0 })).toBe("+2 KiB");
      expect(diff(0, 1536, { decimals: 2 })).toBe("+1.5 KiB");
    });

    it("respects space option", () => {
      expect(diff(0, 1024, { space: false })).toBe("+1KiB");
    });

    it("respects longForm option", () => {
      expect(diff(0, 1024, { longForm: true })).toBe("+1 kibibyte");
      expect(diff(0, 2048, { longForm: true })).toBe("+2 kibibytes");
    });

    it("respects unit option", () => {
      expect(diff(0, 1_048_576, { unit: "KiB" })).toBe("+1024 KiB");
    });

    it("respects exponent option", () => {
      expect(diff(0, 1_048_576, { exponent: 1 })).toBe("+1024 KiB");
    });

    it("respects bits option", () => {
      expect(diff(0, 128, { bits: true })).toBe("+1 Kib");
    });
  });

  describe("edge cases", () => {
    it("handles zero to zero", () => {
      expect(diff(0, 0)).toBe("0 B");
    });

    it("handles very large differences", () => {
      // 1e18 bytes = 888.18 PiB (less than 1 EiB)
      const result = diff(0, 1e18);
      expect(result).toContain("+");
      expect(result).toContain("PiB");
    });

    it("handles fractional byte differences", () => {
      expect(diff(0, 0.5)).toBe("+0.5 B");
    });

    it("throws for non-finite old value", () => {
      expect(() => diff(Number.NaN, 1024)).toThrow(TypeError);
      expect(() => diff(Number.POSITIVE_INFINITY, 1024)).toThrow(TypeError);
    });

    it("throws for non-finite new value", () => {
      expect(() => diff(1024, Number.NaN)).toThrow(TypeError);
      expect(() => diff(1024, Number.POSITIVE_INFINITY)).toThrow(TypeError);
    });

    it("throws for invalid string inputs", () => {
      expect(() => diff("invalid", "1 GiB")).toThrow();
    });
  });

  describe("percentage edge cases", () => {
    it("handles increase from zero", () => {
      expect(diff(0, 1024, { percentage: true })).toBe("+1 KiB (+Infinity%)");
    });

    it("handles small percentage changes", () => {
      // 100 GiB to 101 GiB = +1 GiB (+1%)
      const result = diff("100 GiB", "101 GiB", { percentage: true });
      expect(result).toContain("+1 GiB");
      expect(result).toContain("(+1%)");
    });

    it("rounds percentage to two decimal places", () => {
      // 3 GiB to 4 GiB = +1 GiB (+33.33%)
      const result = diff("3 GiB", "4 GiB", { percentage: true });
      expect(result).toContain("(+33.33%)");
    });
  });

  describe("combined options", () => {
    it("combines percentage with system option", () => {
      expect(diff(1000, 2000, { percentage: true, system: "si" })).toBe(
        "+1 kB (+100%)"
      );
    });

    it("combines percentage with decimals option", () => {
      expect(diff(0, 1536, { decimals: 1, percentage: true })).toBe(
        "+1.5 KiB (+Infinity%)"
      );
    });

    it("combines percentage, signed, and system options", () => {
      // Using SI inputs for predictable SI output
      expect(
        diff(1_000_000_000, 1_500_000_000, {
          percentage: true,
          signed: false,
          system: "si",
        })
      ).toBe("500 MB (50%)");
    });

    it("combines longForm with percentage", () => {
      expect(diff(0, 1024, { longForm: true, percentage: true })).toBe(
        "+1 kibibyte (+Infinity%)"
      );
    });
  });
});
