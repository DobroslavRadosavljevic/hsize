import { describe, expect, it } from "bun:test";

import { parse } from "../src/index";

/**
 * Tests for edge cases in parse.ts to improve coverage
 * Note: Some internal functions like calculateFromParts may be unreachable
 * through the public API due to the regex pattern and UNIT_MAP coverage
 */
describe("parse edge cases", () => {
  describe("number parsing failures", () => {
    it("returns NaN for extremely malformed input", () => {
      expect(parse("")).toBeNaN();
      expect(parse("   ")).toBeNaN();
    });

    it("handles scientific notation", () => {
      expect(parse("1e3 B")).toBe(1000);
      expect(parse("1.5e6 B")).toBe(1_500_000);
    });
  });

  describe("various unit formats", () => {
    it("parses French octets", () => {
      expect(parse("1 ko")).toBe(1000);
      expect(parse("1 Mo")).toBe(1_000_000);
      expect(parse("1 Go")).toBe(1_000_000_000);
    });

    it("parses long form byte units", () => {
      expect(parse("1 byte")).toBe(1);
      expect(parse("5 bytes")).toBe(5);
      expect(parse("1 octet")).toBe(1);
      expect(parse("5 octets")).toBe(5);
    });

    it("parses all SI byte units", () => {
      expect(parse("1 kb")).toBe(1000);
      expect(parse("1 mb")).toBe(1_000_000);
      expect(parse("1 gb")).toBe(1_000_000_000);
      expect(parse("1 tb")).toBe(1_000_000_000_000);
      expect(parse("1 pb")).toBe(1_000_000_000_000_000);
      expect(parse("1 eb")).toBe(1e18);
      expect(parse("1 zb")).toBe(1e21);
      expect(parse("1 yb")).toBe(1e24);
    });

    it("parses all IEC byte units", () => {
      expect(parse("1 kib")).toBe(1024);
      expect(parse("1 mib")).toBe(1_048_576);
      expect(parse("1 gib")).toBe(1_073_741_824);
      expect(parse("1 tib")).toBe(1_099_511_627_776);
      expect(parse("1 pib")).toBe(1_125_899_906_842_624);
      expect(parse("1 eib")).toBe(1024 ** 6);
      expect(parse("1 zib")).toBe(1024 ** 7);
      expect(parse("1 yib")).toBe(1024 ** 8);
    });

    it("parses JEDEC units (uppercase)", () => {
      expect(parse("1 KB")).toBe(1024);
      expect(parse("1 MB")).toBe(1_048_576);
      expect(parse("1 GB")).toBe(1_073_741_824);
      expect(parse("1 EB")).toBe(1024 ** 6);
      expect(parse("1 ZB")).toBe(1024 ** 7);
      expect(parse("1 YB")).toBe(1024 ** 8);
    });
  });

  describe("negative numbers", () => {
    it("parses negative values", () => {
      expect(parse("-1 KB")).toBe(-1024);
      expect(parse("-1.5 MB")).toBe(-1_572_864);
    });

    it("parses positive with explicit sign", () => {
      expect(parse("+1 KB")).toBe(1024);
    });
  });

  describe("whitespace handling", () => {
    it("handles no space between number and unit", () => {
      expect(parse("1KB")).toBe(1024);
      expect(parse("1.5MB")).toBe(1_572_864);
    });

    it("handles multiple spaces", () => {
      expect(parse("1  KB")).toBe(1024);
    });
  });

  describe("long form units via calculateFromParts", () => {
    it("parses kbyte/mbyte/gbyte (IEC base by default due to opts.iec=true)", () => {
      // These units go through calculateFromParts as they're not in UNIT_MAP
      // Default opts.iec=true means base 1024
      expect(parse("1 kbyte")).toBe(1024);
      expect(parse("1 mbyte")).toBe(1_048_576);
      expect(parse("1 gbyte")).toBe(1_073_741_824);
      expect(parse("2 gbytes")).toBe(2_147_483_648);
    });

    it("parses kbyte/mbyte with iec: false (SI base)", () => {
      // Without IEC mode, use base 1000
      expect(parse("1 kbyte", { iec: false })).toBe(1000);
      expect(parse("1 mbyte", { iec: false })).toBe(1_000_000);
      expect(parse("1 gbyte", { iec: false })).toBe(1_000_000_000);
    });

    it("parses kibyte/mibyte/gibyte (IEC base due to 'i')", () => {
      // Units with 'i' always use base 1024 regardless of opts.iec
      expect(parse("1 kibyte")).toBe(1024);
      expect(parse("1 mibyte")).toBe(1_048_576);
      expect(parse("1 gibyte")).toBe(1_073_741_824);
      expect(parse("2 gibytes")).toBe(2_147_483_648);
    });

    it("parses koctet/moctet/goctet (IEC base by default)", () => {
      // Octet variants that go through calculateFromParts
      // Default opts.iec=true means base 1024
      expect(parse("1 koctet")).toBe(1024);
      expect(parse("1 moctet")).toBe(1_048_576);
      expect(parse("2 koctets")).toBe(2048);
      expect(parse("2 moctets")).toBe(2_097_152);
    });

    it("parses koctet/moctet with iec: false (SI base)", () => {
      expect(parse("1 koctet", { iec: false })).toBe(1000);
      expect(parse("1 moctet", { iec: false })).toBe(1_000_000);
    });

    it("parses kioctet/mioctet (IEC octets with 'i')", () => {
      // Octet with 'i' uses base 1024
      expect(parse("1 kioctet")).toBe(1024);
      expect(parse("1 mioctet")).toBe(1_048_576);
    });

    it("parses all prefix levels through calculateFromParts", () => {
      // Test all prefixes with default IEC (base 1024)
      expect(parse("1 tbyte")).toBe(1024 ** 4);
      expect(parse("1 pbyte")).toBe(1024 ** 5);
      expect(parse("1 ebyte")).toBe(1024 ** 6);
      expect(parse("1 zbyte")).toBe(1024 ** 7);
      expect(parse("1 ybyte")).toBe(1024 ** 8);
    });

    it("parses all prefix levels with iec: false (SI base)", () => {
      // Test all prefixes with SI (base 1000)
      expect(parse("1 tbyte", { iec: false })).toBe(1e12);
      expect(parse("1 pbyte", { iec: false })).toBe(1e15);
      expect(parse("1 ebyte", { iec: false })).toBe(1e18);
      expect(parse("1 zbyte", { iec: false })).toBe(1e21);
      expect(parse("1 ybyte", { iec: false })).toBe(1e24);
    });
  });
});
