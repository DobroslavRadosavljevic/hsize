import { describe, expect, it } from "bun:test";

import { extract } from "../src/index";

describe("extract", () => {
  describe("basic extraction", () => {
    it("handles text with invalid number patterns", () => {
      const results = extract("Size: NaN KB and abc MB");
      expect(results.length).toBe(0);
    });

    it("extracts single byte value", () => {
      const results = extract("File size: 1.5 MB");
      expect(results.length).toBe(1);
      expect(results[0].value).toBe(1.5);
      expect(results[0].unit).toBe("MB");
      expect(results[0].bytes).toBe(1_572_864);
    });

    it("extracts multiple byte values", () => {
      const results = extract("My 16GB drive has 4GB free");
      expect(results.length).toBe(2);
      expect(results[0].value).toBe(16);
      expect(results[0].unit).toBe("GB");
      expect(results[1].value).toBe(4);
      expect(results[1].unit).toBe("GB");
    });

    it("returns empty array for no matches", () => {
      const results = extract("No bytes here");
      expect(results.length).toBe(0);
    });
  });

  describe("value formats", () => {
    it("extracts values with decimals", () => {
      const results = extract("Downloaded 2.5 GiB of 10 GiB");
      expect(results.length).toBe(2);
      expect(results[0].value).toBe(2.5);
      expect(results[1].value).toBe(10);
    });

    it("extracts different unit types", () => {
      const results = extract("RAM: 16 GiB, SSD: 512 GB, Network: 100 Mbps");
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it("extracts negative byte values", () => {
      const results = extract("Change: -500 MB");
      expect(results.length).toBe(1);
      expect(results[0].value).toBe(-500);
    });

    it("extracts values with scientific notation", () => {
      const results = extract("Large file: 1.5e6 B");
      expect(results.length).toBe(1);
      expect(results[0].value).toBe(1_500_000);
    });
  });

  describe("position information", () => {
    it("includes position information", () => {
      const results = extract("Size: 1 KiB");
      expect(results[0].start).toBe(6);
      expect(results[0].end).toBe(11);
      expect(results[0].input).toBe("1 KiB");
    });

    it("extracts values at start of string", () => {
      const results = extract("1 KB is the size");
      expect(results[0].start).toBe(0);
    });

    it("extracts values at end of string", () => {
      const results = extract("Size is 1 KB");
      expect(results[0].end).toBe(12);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const results = extract("");
      expect(results.length).toBe(0);
    });
  });
});
