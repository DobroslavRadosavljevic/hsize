import { describe, expect, it } from "bun:test";

import { partial } from "../src/index";

describe("partial", () => {
  describe("basic usage", () => {
    it("creates a pre-configured formatter", () => {
      const formatStorage = partial({ decimals: 1, system: "si" });
      expect(formatStorage(1_500_000_000)).toBe("1.5 GB");
    });

    it("formats with default IEC system", () => {
      const formatIEC = partial({});
      expect(formatIEC(1024)).toBe("1 KiB");
    });

    it("formats with SI system", () => {
      const formatSI = partial({ system: "si" });
      expect(formatSI(1000)).toBe("1 kB");
      expect(formatSI(1_000_000)).toBe("1 MB");
    });

    it("formats with JEDEC system", () => {
      const formatJEDEC = partial({ system: "jedec" });
      expect(formatJEDEC(1024)).toBe("1 KB");
    });

    it("respects decimals option", () => {
      const format2 = partial({ decimals: 2 });
      expect(format2(1536)).toBe("1.5 KiB");

      const format0 = partial({ decimals: 0 });
      expect(format0(1536)).toBe("2 KiB");
    });
  });

  describe("override options", () => {
    it("allows overriding base options", () => {
      const formatSI = partial({ system: "si" });
      expect(formatSI(1000)).toBe("1 kB");
      expect(formatSI(1024, { system: "iec" })).toBe("1 KiB");
    });

    it("allows overriding decimals", () => {
      const format = partial({ decimals: 2 });
      expect(format(1536)).toBe("1.5 KiB");
      expect(format(1536, { decimals: 0 })).toBe("2 KiB");
    });

    it("merges options correctly", () => {
      const format = partial({ decimals: 1, system: "si" });
      expect(format(1500, { signed: true })).toBe("+1.5 kB");
    });
  });

  describe("output formats", () => {
    it("supports array output via override", () => {
      const format = partial({ system: "iec" });
      const result = format(1024, { output: "array" });
      expect(result[0]).toBe(1);
      expect(result[1]).toBe("KiB");
    });

    it("supports object output via override", () => {
      const format = partial({ system: "iec" });
      const result = format(1024, { output: "object" });
      expect(result.bytes).toBe(1024);
      expect(result.value).toBe(1);
      expect(result.unit).toBe("KiB");
    });

    it("supports exponent output via override", () => {
      const format = partial({ system: "iec" });
      const result = format(1024, { output: "exponent" });
      expect(result).toBe(1);
    });

    it("supports base options with array output", () => {
      const formatArray = partial({ output: "array" });
      const result = formatArray(1024);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe("KiB");
    });

    it("supports base options with object output", () => {
      const formatObject = partial({ output: "object" });
      const result = formatObject(1024);
      expect(result.bytes).toBe(1024);
      expect(result.value).toBe(1);
      expect(result.unit).toBe("KiB");
    });

    it("supports base options with exponent output", () => {
      const formatExponent = partial({ output: "exponent" });
      const result = formatExponent(1024);
      expect(result).toBe(1);
    });
  });

  describe("bits formatting", () => {
    it("formats as bits", () => {
      const formatBits = partial({ bits: true });
      expect(formatBits(1024)).toBe("8 Kib");
    });

    it("formats bits with SI system", () => {
      const formatBitsSI = partial({ bits: true, system: "si" });
      expect(formatBitsSI(125)).toBe("1 kb");
    });
  });

  describe("formatting options", () => {
    it("supports signed option", () => {
      const formatSigned = partial({ signed: true });
      expect(formatSigned(1024)).toBe("+1 KiB");
    });

    it("supports space option", () => {
      const formatNoSpace = partial({ space: false });
      expect(formatNoSpace(1024)).toBe("1KiB");
    });

    it("supports custom spacer", () => {
      const formatCustom = partial({ spacer: "_" });
      expect(formatCustom(1024)).toBe("1_KiB");
    });

    it("supports long form", () => {
      const formatLong = partial({ longForm: true });
      expect(formatLong(1024)).toBe("1 kibibyte");
      expect(formatLong(2048)).toBe("2 kibibytes");
    });

    it("supports fixed unit", () => {
      const formatMiB = partial({ unit: "MiB" });
      expect(formatMiB(1_048_576)).toBe("1 MiB");
      expect(formatMiB(2_097_152)).toBe("2 MiB");
    });

    it("supports locale", () => {
      const formatDE = partial({ locale: "de-DE" });
      const result = formatDE(1536);
      expect(result).toContain("1,5");
    });
  });

  describe("edge cases", () => {
    it("handles zero", () => {
      const format = partial({});
      expect(format(0)).toBe("0 B");
    });

    it("handles negative values", () => {
      const format = partial({});
      expect(format(-1024)).toBe("-1 KiB");
    });

    it("handles BigInt", () => {
      const format = partial({});
      expect(format(1024n)).toBe("1 KiB");
    });

    it("handles very large numbers", () => {
      const format = partial({ system: "si" });
      expect(format(1e24)).toBe("1 YB");
    });

    it("throws for NaN", () => {
      const format = partial({});
      expect(() => format(Number.NaN)).toThrow();
    });

    it("throws for Infinity", () => {
      const format = partial({});
      expect(() => format(Number.POSITIVE_INFINITY)).toThrow();
    });
  });

  describe("multiple instances", () => {
    it("creates independent instances", () => {
      const formatSI = partial({ system: "si" });
      const formatIEC = partial({ system: "iec" });

      expect(formatSI(1000)).toBe("1 kB");
      expect(formatIEC(1024)).toBe("1 KiB");

      // They should not affect each other
      expect(formatSI(1024)).toBe("1.02 kB");
      expect(formatIEC(1000)).toBe("1000 B");
    });

    it("allows creating specialized formatters", () => {
      const formatDownload = partial({ bits: true, decimals: 1, system: "si" });
      const formatStorage = partial({ decimals: 2, system: "iec" });

      expect(formatDownload(125_000_000)).toBe("1 Gb");
      expect(formatStorage(1_073_741_824)).toBe("1 GiB");
    });
  });

  describe("functional composition", () => {
    it("can be used with map", () => {
      const formatSI = partial({ decimals: 1, system: "si" });
      const sizes = [1000, 2_000_000, 3_000_000_000];
      const formatted = sizes.map(formatSI);
      expect(formatted).toEqual(["1 kB", "2 MB", "3 GB"]);
    });

    it("can be passed as a callback", () => {
      const formatIEC = partial({ system: "iec" });
      const result = [1024, 1_048_576, 1_073_741_824].map(formatIEC);
      expect(result).toEqual(["1 KiB", "1 MiB", "1 GiB"]);
    });
  });
});
