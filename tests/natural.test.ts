import { describe, expect, it } from "bun:test";

import { parseNatural } from "../src/index";

describe("parseNatural", () => {
  describe("basic informal units", () => {
    it("parses gig/gigs", () => {
      expect(parseNatural("2 gigs")).toBe(2 * 1024 ** 3);
      expect(parseNatural("1 gig")).toBe(1024 ** 3);
      expect(parseNatural("5 gigs")).toBe(5 * 1024 ** 3);
    });

    it("parses meg/megs", () => {
      expect(parseNatural("500 megs")).toBe(500 * 1024 ** 2);
      expect(parseNatural("1 meg")).toBe(1024 ** 2);
      expect(parseNatural("100 megs")).toBe(100 * 1024 ** 2);
    });

    it("parses tera/teras", () => {
      expect(parseNatural("1 tera")).toBe(1024 ** 4);
      expect(parseNatural("2 teras")).toBe(2 * 1024 ** 4);
    });

    it("parses kilo/kilos", () => {
      expect(parseNatural("100 kilos")).toBe(100 * 1024);
      expect(parseNatural("1 kilo")).toBe(1024);
    });

    it("parses peta/petas", () => {
      expect(parseNatural("1 peta")).toBe(1024 ** 5);
      expect(parseNatural("2 petas")).toBe(2 * 1024 ** 5);
    });
  });

  describe("approximation words", () => {
    it("handles 'about'", () => {
      expect(parseNatural("about 2 gigs")).toBe(2 * 1024 ** 3);
    });

    it("handles 'around'", () => {
      expect(parseNatural("around 500 megs")).toBe(500 * 1024 ** 2);
    });

    it("handles 'roughly'", () => {
      expect(parseNatural("roughly 1 tera")).toBe(1024 ** 4);
    });

    it("handles 'approximately'", () => {
      expect(parseNatural("approximately 10 gigs")).toBe(10 * 1024 ** 3);
    });

    it("handles 'nearly'", () => {
      expect(parseNatural("nearly 8 gigs")).toBe(8 * 1024 ** 3);
    });

    it("handles 'almost'", () => {
      expect(parseNatural("almost 4 gigs")).toBe(4 * 1024 ** 3);
    });
  });

  describe("fractions", () => {
    it("parses 'half a terabyte'", () => {
      expect(parseNatural("half a terabyte")).toBe(Math.round(0.5 * 1024 ** 4));
    });

    it("parses 'half a gig'", () => {
      expect(parseNatural("half a gig")).toBe(Math.round(0.5 * 1024 ** 3));
    });

    it("parses 'quarter of a gig'", () => {
      expect(parseNatural("quarter of a gig")).toBe(
        Math.round(0.25 * 1024 ** 3)
      );
    });

    it("parses 'a third of a terabyte'", () => {
      expect(parseNatural("a third of a terabyte")).toBe(
        Math.round((1 / 3) * 1024 ** 4)
      );
    });
  });

  describe("quantities", () => {
    it("parses 'a couple gigs'", () => {
      expect(parseNatural("a couple gigs")).toBe(2 * 1024 ** 3);
    });

    it("parses 'a few gigs'", () => {
      expect(parseNatural("a few gigs")).toBe(3 * 1024 ** 3);
    });

    it("parses 'several gigs'", () => {
      expect(parseNatural("several gigs")).toBe(5 * 1024 ** 3);
    });

    it("parses 'a gig'", () => {
      expect(parseNatural("a gig")).toBe(1024 ** 3);
    });

    it("parses word numbers", () => {
      expect(parseNatural("two gigs")).toBe(2 * 1024 ** 3);
      expect(parseNatural("three megs")).toBe(3 * 1024 ** 2);
      expect(parseNatural("five kilos")).toBe(5 * 1024);
    });
  });

  describe("multipliers", () => {
    it("parses 'a couple hundred megs'", () => {
      expect(parseNatural("a couple hundred megs")).toBe(200 * 1024 ** 2);
    });

    it("parses 'few hundred megs'", () => {
      expect(parseNatural("few hundred megs")).toBe(300 * 1024 ** 2);
    });

    it("parses 'a few thousand kilos'", () => {
      expect(parseNatural("a few thousand kilos")).toBe(3000 * 1024);
    });

    it("parses 'several hundred gigs'", () => {
      expect(parseNatural("several hundred gigs")).toBe(500 * 1024 ** 3);
    });
  });

  describe("unit aliases", () => {
    it("parses full unit names", () => {
      expect(parseNatural("2 gigabytes")).toBe(2 * 1024 ** 3);
      expect(parseNatural("100 megabytes")).toBe(100 * 1024 ** 2);
      expect(parseNatural("1 terabyte")).toBe(1024 ** 4);
    });

    it("parses abbreviations", () => {
      expect(parseNatural("2 gb")).toBe(2 * 1024 ** 3);
      expect(parseNatural("500 mb")).toBe(500 * 1024 ** 2);
      expect(parseNatural("1 tb")).toBe(1024 ** 4);
    });

    it("parses single letter abbreviations", () => {
      expect(parseNatural("2 g")).toBe(2 * 1024 ** 3);
      expect(parseNatural("500 m")).toBe(500 * 1024 ** 2);
      expect(parseNatural("1 t")).toBe(1024 ** 4);
    });
  });

  describe("combined patterns", () => {
    it("parses 'about a couple hundred megs'", () => {
      expect(parseNatural("about a couple hundred megs")).toBe(200 * 1024 ** 2);
    });

    it("parses 'roughly half a gig'", () => {
      expect(parseNatural("roughly half a gig")).toBe(
        Math.round(0.5 * 1024 ** 3)
      );
    });

    it("parses 'around a few gigs'", () => {
      expect(parseNatural("around a few gigs")).toBe(3 * 1024 ** 3);
    });
  });

  describe("case insensitivity", () => {
    it("handles uppercase", () => {
      expect(parseNatural("ABOUT 2 GIGS")).toBe(2 * 1024 ** 3);
    });

    it("handles mixed case", () => {
      expect(parseNatural("About 2 Gigs")).toBe(2 * 1024 ** 3);
    });
  });

  describe("decimal values", () => {
    it("parses decimal numbers", () => {
      expect(parseNatural("1.5 gigs")).toBe(Math.round(1.5 * 1024 ** 3));
      expect(parseNatural("2.5 megs")).toBe(Math.round(2.5 * 1024 ** 2));
    });

    it("parses decimal with approximation", () => {
      expect(parseNatural("about 1.5 gigs")).toBe(Math.round(1.5 * 1024 ** 3));
    });
  });

  describe("error handling", () => {
    it("returns NaN for invalid input", () => {
      expect(parseNatural("invalid text")).toBeNaN();
      expect(parseNatural("no units here")).toBeNaN();
      expect(parseNatural("")).toBeNaN();
    });

    it("returns NaN when no quantity is found", () => {
      expect(parseNatural("gigs")).toBeNaN();
    });

    it("throws in strict mode for invalid input", () => {
      expect(() => parseNatural("invalid", { strict: true })).toThrow(
        TypeError
      );
    });

    it("throws in strict mode for empty input", () => {
      expect(() => parseNatural("", { strict: true })).toThrow(TypeError);
    });

    it("throws in strict mode when no unit is found", () => {
      expect(() => parseNatural("about 5", { strict: true })).toThrow(
        TypeError
      );
    });

    it("throws in strict mode when no quantity is found", () => {
      expect(() => parseNatural("gigs", { strict: true })).toThrow(TypeError);
    });
  });

  describe("edge cases", () => {
    it("handles extra whitespace", () => {
      expect(parseNatural("  about   2   gigs  ")).toBe(2 * 1024 ** 3);
    });

    it("handles punctuation", () => {
      expect(parseNatural("about 2 gigs!")).toBe(2 * 1024 ** 3);
    });

    it("prefers IEC (1024-based) interpretation", () => {
      // Verify we're using 1024-based multipliers
      expect(parseNatural("1 gig")).toBe(1024 ** 3);
      expect(parseNatural("1 meg")).toBe(1024 ** 2);
      expect(parseNatural("1 kilo")).toBe(1024);
    });
  });
});
