import { describe, expect, it } from "bun:test";

import { formatRange } from "../src/index";

describe("formatRange", () => {
  describe("basic formatting", () => {
    it("formats a range with numeric values", () => {
      expect(formatRange(1024, 2048)).toBe("1 KiB – 2 KiB");
    });

    it("formats a range with string values", () => {
      // String inputs are parsed to bytes then formatted with default IEC system
      expect(formatRange("500 MiB", "2 GiB")).toBe("500 MiB – 2 GiB");
    });

    it("formats a range with mixed inputs", () => {
      expect(formatRange(1024, "2 KiB")).toBe("1 KiB – 2 KiB");
      expect(formatRange("1 KiB", 2048)).toBe("1 KiB – 2 KiB");
    });

    it("formats bytes range", () => {
      expect(formatRange(100, 500)).toBe("100 B – 500 B");
    });

    it("formats large range", () => {
      expect(formatRange(1_073_741_824, 2_147_483_648)).toBe("1 GiB – 2 GiB");
    });
  });

  describe("collapse behavior", () => {
    it("collapses when min equals max (default)", () => {
      expect(formatRange(1024, 1024)).toBe("1 KiB");
    });

    it("does not collapse when collapse is false", () => {
      expect(formatRange(1024, 1024, { collapse: false })).toBe(
        "1 KiB – 1 KiB"
      );
    });

    it("collapses with string inputs when equal", () => {
      expect(formatRange("1 KiB", "1 KiB")).toBe("1 KiB");
    });

    it("does not collapse when values differ", () => {
      expect(formatRange(1024, 2048)).toBe("1 KiB – 2 KiB");
    });
  });

  describe("separator option", () => {
    it("uses default en-dash separator", () => {
      expect(formatRange(1024, 2048)).toBe("1 KiB – 2 KiB");
    });

    it("uses custom separator", () => {
      expect(formatRange(1024, 2048, { separator: " - " })).toBe(
        "1 KiB - 2 KiB"
      );
    });

    it("uses 'to' as separator", () => {
      expect(formatRange(1024, 2048, { separator: " to " })).toBe(
        "1 KiB to 2 KiB"
      );
    });

    it("uses arrow as separator", () => {
      expect(formatRange(1024, 2048, { separator: " → " })).toBe(
        "1 KiB → 2 KiB"
      );
    });
  });

  describe("format options", () => {
    it("respects system option for SI", () => {
      expect(formatRange(1000, 2000, { system: "si" })).toBe("1 kB – 2 kB");
    });

    it("respects system option for JEDEC", () => {
      expect(formatRange(1024, 2048, { system: "jedec" })).toBe("1 KB – 2 KB");
    });

    it("respects decimals option", () => {
      expect(formatRange(1536, 2560, { decimals: 1 })).toBe(
        "1.5 KiB – 2.5 KiB"
      );
    });

    it("respects space option", () => {
      expect(formatRange(1024, 2048, { space: false })).toBe("1KiB – 2KiB");
    });

    it("respects signed option", () => {
      expect(formatRange(1024, 2048, { signed: true })).toBe("+1 KiB – +2 KiB");
    });

    it("respects longForm option", () => {
      expect(formatRange(1024, 2048, { longForm: true })).toBe(
        "1 kibibyte – 2 kibibytes"
      );
    });

    it("respects bits option", () => {
      expect(formatRange(128, 256, { bits: true })).toBe("1 Kib – 2 Kib");
    });

    it("respects unit option", () => {
      expect(formatRange(1_048_576, 2_097_152, { unit: "KiB" })).toBe(
        "1024 KiB – 2048 KiB"
      );
    });
  });

  describe("combined options", () => {
    it("combines separator with format options", () => {
      expect(formatRange(1024, 2048, { separator: " to ", system: "si" })).toBe(
        "1.02 kB to 2.05 kB"
      );
    });

    it("combines collapse with custom separator", () => {
      expect(
        formatRange(1024, 1024, { collapse: false, separator: " - " })
      ).toBe("1 KiB - 1 KiB");
    });

    it("combines multiple format options", () => {
      expect(
        formatRange(1536, 3072, {
          decimals: 1,
          separator: " - ",
          system: "si",
        })
      ).toBe("1.5 kB - 3.1 kB");
    });
  });

  describe("bigint support", () => {
    it("handles bigint inputs", () => {
      expect(formatRange(1024n, 2048n)).toBe("1 KiB – 2 KiB");
    });

    it("handles mixed bigint and number", () => {
      expect(formatRange(1024n, 2048)).toBe("1 KiB – 2 KiB");
      expect(formatRange(1024, 2048n)).toBe("1 KiB – 2 KiB");
    });
  });

  describe("edge cases", () => {
    it("handles zero range", () => {
      expect(formatRange(0, 0)).toBe("0 B");
    });

    it("handles zero to value", () => {
      expect(formatRange(0, 1024)).toBe("0 B – 1 KiB");
    });

    it("handles negative values", () => {
      expect(formatRange(-1024, 1024)).toBe("-1 KiB – 1 KiB");
    });

    it("handles reversed range (min > max)", () => {
      expect(formatRange(2048, 1024)).toBe("2 KiB – 1 KiB");
    });

    it("handles very large numbers", () => {
      const result = formatRange(1e15, 1e18);
      expect(result).toContain("TiB");
      expect(result).toContain("PiB");
    });

    it("handles fractional bytes", () => {
      expect(formatRange(0.5, 1.5)).toBe("0.5 B – 1.5 B");
    });
  });
});
