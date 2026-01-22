import { describe, expect, it } from "bun:test";

import { create } from "../src/index";

describe("custom units", () => {
  const customUnits = {
    base: 1024,
    units: [
      { name: "chunk", nameP: "chunks", symbol: "ch" },
      { name: "block", nameP: "blocks", symbol: "bl" },
      { name: "sector", nameP: "sectors", symbol: "sc" },
      { name: "region", nameP: "regions", symbol: "rg" },
    ],
  };

  const custom = create({ customUnits });

  describe("format", () => {
    it("formats base unit", () => {
      expect(custom.format(1)).toBe("1 ch");
      expect(custom.format(512)).toBe("512 ch");
    });

    it("formats second level unit", () => {
      expect(custom.format(1024)).toBe("1 bl");
      expect(custom.format(1_048_576)).toBe("1 sc");
      expect(custom.format(1_073_741_824)).toBe("1 rg");
    });

    it("formats intermediate values", () => {
      expect(custom.format(1536)).toBe("1.5 bl");
      expect(custom.format(2_097_152)).toBe("2 sc");
    });

    it("supports longForm option", () => {
      expect(custom.format(1, { longForm: true })).toBe("1 chunk");
      expect(custom.format(2, { longForm: true })).toBe("2 chunks");
      expect(custom.format(1024, { longForm: true })).toBe("1 block");
      expect(custom.format(2048, { longForm: true })).toBe("2 blocks");
      expect(custom.format(1_048_576, { longForm: true })).toBe("1 sector");
      expect(custom.format(2_097_152, { longForm: true })).toBe("2 sectors");
      expect(custom.format(1_073_741_824, { longForm: true })).toBe("1 region");
      expect(custom.format(2_147_483_648, { longForm: true })).toBe(
        "2 regions"
      );
    });

    it("supports decimals option", () => {
      expect(custom.format(1536, { decimals: 0 })).toBe("2 bl");
      expect(custom.format(1536, { decimals: 3 })).toBe("1.5 bl");
    });

    it("supports signed option", () => {
      expect(custom.format(1024, { signed: true })).toBe("+1 bl");
    });

    it("supports space option", () => {
      expect(custom.format(1024, { space: false })).toBe("1bl");
    });

    it("supports exponent option", () => {
      expect(custom.format(1_073_741_824, { exponent: 0 })).toBe(
        "1073741824 ch"
      );
      expect(custom.format(1_073_741_824, { exponent: 1 })).toBe("1048576 bl");
      expect(custom.format(1_073_741_824, { exponent: 2 })).toBe("1024 sc");
      expect(custom.format(1_073_741_824, { exponent: 3 })).toBe("1 rg");
    });

    it("handles negative values", () => {
      expect(custom.format(-1024)).toBe("-1 bl");
      expect(custom.format(-1536)).toBe("-1.5 bl");
    });

    it("handles bigint values", () => {
      expect(custom.format(1024n)).toBe("1 bl");
      expect(custom.format(1_073_741_824n)).toBe("1 rg");
    });

    it("clamps exponent to max available", () => {
      // With only 4 units (0-3), values beyond rg should still show in rg
      // This value would need a 5th level unit
      const largeValue = 1024 ** 5;
      const result = custom.format(largeValue);
      expect(result).toContain("rg");
    });
  });

  describe("parse", () => {
    it("parses short symbols", () => {
      expect(custom.parse("1 ch")).toBe(1);
      expect(custom.parse("1 bl")).toBe(1024);
      expect(custom.parse("1 sc")).toBe(1_048_576);
      expect(custom.parse("1 rg")).toBe(1_073_741_824);
    });

    it("parses long names (singular)", () => {
      expect(custom.parse("1 chunk")).toBe(1);
      expect(custom.parse("1 block")).toBe(1024);
      expect(custom.parse("1 sector")).toBe(1_048_576);
      expect(custom.parse("1 region")).toBe(1_073_741_824);
    });

    it("parses long names (plural)", () => {
      expect(custom.parse("2 chunks")).toBe(2);
      expect(custom.parse("2 blocks")).toBe(2048);
      expect(custom.parse("2 sectors")).toBe(2_097_152);
      expect(custom.parse("2 regions")).toBe(2_147_483_648);
    });

    it("parses decimal values", () => {
      expect(custom.parse("1.5 bl")).toBe(1536);
      expect(custom.parse("2.5 sc")).toBe(2_621_440);
    });

    it("parses case-insensitively", () => {
      expect(custom.parse("1 CH")).toBe(1);
      expect(custom.parse("1 BL")).toBe(1024);
      expect(custom.parse("1 CHUNK")).toBe(1);
      expect(custom.parse("1 BLOCKS")).toBe(1024);
    });

    it("parses without space", () => {
      expect(custom.parse("1bl")).toBe(1024);
      expect(custom.parse("1.5sc")).toBe(1_572_864);
    });

    it("parses number input (passthrough)", () => {
      expect(custom.parse(1024)).toBe(1024);
      expect(custom.parse(1536)).toBe(1536);
    });

    it("parses bigint input (passthrough)", () => {
      expect(custom.parse(1024n)).toBe(1024);
    });

    it("returns NaN for unknown units (non-strict)", () => {
      expect(custom.parse("1 KB")).toBeNaN();
      expect(custom.parse("1 MiB")).toBeNaN();
      expect(custom.parse("1 unknown")).toBeNaN();
    });

    it("throws for unknown units (strict mode)", () => {
      const strictCustom = create({ customUnits, strict: true });
      expect(() => strictCustom.parse("1 KB")).toThrow(TypeError);
      expect(() => strictCustom.parse("1 unknown")).toThrow(TypeError);
    });

    it("returns NaN for empty string (non-strict)", () => {
      expect(custom.parse("")).toBeNaN();
    });

    it("throws for empty string (strict mode)", () => {
      const strictCustom = create({ customUnits, strict: true });
      expect(() => strictCustom.parse("")).toThrow(TypeError);
    });

    it("treats unitless number as base unit", () => {
      expect(custom.parse("100")).toBe(100);
    });
  });

  describe("callable instance", () => {
    it("formats when called with number", () => {
      expect(custom(1024)).toBe("1 bl");
      expect(custom(1_048_576)).toBe("1 sc");
    });

    it("parses when called with string", () => {
      expect(custom("1 bl")).toBe(1024);
      expect(custom("2 sectors")).toBe(2_097_152);
    });
  });

  describe("decimal base units", () => {
    const decimal = create({
      customUnits: {
        base: 1000,
        units: [
          { name: "unit", nameP: "units", symbol: "u" },
          { name: "kilo-unit", nameP: "kilo-units", symbol: "ku" },
          { name: "mega-unit", nameP: "mega-units", symbol: "Mu" },
        ],
      },
    });

    it("formats with decimal base", () => {
      expect(decimal.format(1)).toBe("1 u");
      expect(decimal.format(1000)).toBe("1 ku");
      expect(decimal.format(1_000_000)).toBe("1 Mu");
      expect(decimal.format(1500)).toBe("1.5 ku");
    });

    it("parses with decimal base", () => {
      expect(decimal.parse("1 u")).toBe(1);
      expect(decimal.parse("1 ku")).toBe(1000);
      expect(decimal.parse("1 Mu")).toBe(1_000_000);
      expect(decimal.parse("1.5 ku")).toBe(1500);
    });
  });

  describe("format options compatibility", () => {
    it("works with pad option", () => {
      expect(custom.format(1024, { decimals: 2, pad: true })).toBe("1.00 bl");
    });

    it("works with fixedWidth option", () => {
      const result = custom.format(1024, { fixedWidth: 10 });
      expect(result.length).toBe(10);
      expect(result).toBe("      1 bl");
    });

    it("works with nonBreakingSpace option", () => {
      const result = custom.format(1024, { nonBreakingSpace: true });
      expect(result).toBe("1\u00A0bl");
    });

    it("works with spacer option", () => {
      expect(custom.format(1024, { spacer: "-" })).toBe("1-bl");
    });

    it("works with roundingMethod option", () => {
      expect(
        custom.format(1500, { decimals: 0, roundingMethod: "floor" })
      ).toBe("1 bl");
      expect(custom.format(1500, { decimals: 0, roundingMethod: "ceil" })).toBe(
        "2 bl"
      );
    });
  });

  describe("nested create", () => {
    it("allows creating new instance from custom instance", () => {
      const nested = custom.create({ decimals: 3 });
      expect(typeof nested.format).toBe("function");
      // Note: nested instance does not inherit customUnits
      expect(nested.format(1024)).toBe("1 KiB");
    });
  });

  describe("instance methods", () => {
    it("has extract method", () => {
      expect(typeof custom.extract).toBe("function");
      // Note: extract uses the global patterns, not custom units
      const results = custom.extract("File size: 1.5 MB");
      expect(results.length).toBe(1);
    });

    it("has unit method", () => {
      expect(typeof custom.unit).toBe("function");
      // Note: unit uses the global format/parse, not custom units
      const u = custom.unit(1024);
      expect(u.bytes).toBe(1024);
    });
  });
});
