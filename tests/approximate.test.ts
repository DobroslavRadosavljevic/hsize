import { describe, expect, it } from "bun:test";

import { approximate } from "../src/index";

describe("approximate", () => {
  describe("basic formatting", () => {
    it("formats exact values without prefix", () => {
      expect(approximate(1_073_741_824)).toBe("1 GiB");
    });

    it("formats non-exact values with ~ prefix", () => {
      expect(approximate(1_500_000_000)).toBe("~1.4 GiB");
    });

    it("formats zero", () => {
      expect(approximate(0)).toBe("0 B");
    });

    it("formats small values", () => {
      expect(approximate(100)).toBe("100 B");
    });
  });

  describe("almost and just over", () => {
    it("uses 'almost' when just below a round number", () => {
      // 999 MB is within 5% of 1 GB (SI)
      const result = approximate(999_000_000, { system: "si" });
      expect(result).toBe("almost 1 GB");
    });

    it("uses 'just over' when just above a round number", () => {
      // 1.01 GB is within 5% above 1 GB (SI)
      const result = approximate(1_010_000_000, { system: "si" });
      expect(result).toBe("just over 1 GB");
    });

    it("uses '~' for values not near round numbers", () => {
      // 1.5 GB is not near a round number
      const result = approximate(1_500_000_000, { system: "si" });
      expect(result).toBe("~1.5 GB");
    });
  });

  describe("verbose style", () => {
    it("uses 'about' prefix in verbose style", () => {
      const result = approximate(1_500_000_000, {
        style: "verbose",
        system: "si",
      });
      expect(result).toBe("about 1.5 GB");
    });

    it("uses 'almost' in verbose style", () => {
      const result = approximate(999_000_000, {
        style: "verbose",
        system: "si",
      });
      expect(result).toBe("almost 1 GB");
    });

    it("uses 'just over' in verbose style", () => {
      const result = approximate(1_010_000_000, {
        style: "verbose",
        system: "si",
      });
      expect(result).toBe("just over 1 GB");
    });
  });

  describe("threshold option", () => {
    it("uses default 5% threshold", () => {
      // 4% below 1 GB should be "almost"
      const result = approximate(960_000_000, { system: "si" });
      expect(result).toBe("almost 1 GB");
    });

    it("respects custom threshold", () => {
      // 10% below should be "almost" with threshold: 10
      const result = approximate(900_000_000, { system: "si", threshold: 10 });
      expect(result).toBe("almost 1 GB");
    });

    it("does not use almost when outside custom threshold", () => {
      // 10% below 1 GB should NOT be "almost" with threshold: 5
      const result = approximate(900_000_000, { system: "si", threshold: 5 });
      expect(result).not.toContain("almost");
      // Should be "900 MB" since it's an exact value at MB level
      expect(result).toBe("900 MB");
    });
  });

  describe("unit systems", () => {
    it("uses IEC units by default", () => {
      const result = approximate(1_073_741_824);
      expect(result).toBe("1 GiB");
    });

    it("uses SI units when specified", () => {
      const result = approximate(1_000_000_000, { system: "si" });
      expect(result).toBe("1 GB");
    });

    it("uses JEDEC units when specified", () => {
      const result = approximate(1_073_741_824, { system: "jedec" });
      expect(result).toBe("1 GB");
    });
  });

  describe("format options passthrough", () => {
    it("respects space option", () => {
      const result = approximate(1_073_741_824, { space: false });
      expect(result).toBe("1GiB");
    });

    it("respects spacer option", () => {
      const result = approximate(1_073_741_824, { spacer: "_" });
      expect(result).toBe("1_GiB");
    });

    it("respects decimals option", () => {
      const result = approximate(1_500_000_000, { decimals: 2, system: "si" });
      expect(result).toBe("~1.5 GB");
    });
  });

  describe("negative values", () => {
    it("handles negative values", () => {
      const result = approximate(-1_073_741_824);
      expect(result).toBe("-1 GiB");
    });

    it("handles negative values with almost", () => {
      const result = approximate(-999_000_000, { system: "si" });
      expect(result).toBe("almost -1 GB");
    });
  });

  describe("BigInt support", () => {
    it("handles BigInt values", () => {
      const result = approximate(1_073_741_824n);
      expect(result).toBe("1 GiB");
    });

    it("handles large BigInt values", () => {
      const result = approximate(1_099_511_627_776n);
      expect(result).toBe("1 TiB");
    });
  });

  describe("edge cases", () => {
    it("throws for NaN", () => {
      expect(() => approximate(Number.NaN)).toThrow(TypeError);
    });

    it("throws for Infinity", () => {
      expect(() => approximate(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    });

    it("handles exact unit boundaries", () => {
      expect(approximate(1024)).toBe("1 KiB");
      expect(approximate(1_048_576)).toBe("1 MiB");
    });
  });

  describe("hsize.approximate method", () => {
    it("is accessible on hsize object", async () => {
      const module = await import("../src/index");
      const hsize = module.default;
      expect(hsize.approximate).toBeDefined();
      expect(hsize.approximate(1_073_741_824)).toBe("1 GiB");
    });
  });
});
