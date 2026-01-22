import { describe, expect, it } from "bun:test";

import { percent, percentOf, remaining } from "../src/index";

describe("percent", () => {
  describe("basic percentage calculations", () => {
    it("calculates 50% of total", () => {
      expect(percent("512 MiB", "1 GiB")).toBe(50);
      expect(percent(512, 1024)).toBe(50);
    });

    it("calculates 25% of total", () => {
      expect(percent("1 GB", "4 GB")).toBe(25);
      expect(percent("256 MiB", "1 GiB")).toBe(25);
    });

    it("calculates 100% when part equals total", () => {
      expect(percent("1 GB", "1 GB")).toBe(100);
      expect(percent(1024, 1024)).toBe(100);
    });

    it("calculates 0% for zero part", () => {
      expect(percent(0, "1 GB")).toBe(0);
      expect(percent("0 B", "1 GB")).toBe(0);
    });

    it("calculates percentage exceeding 100%", () => {
      expect(percent("2 GB", "1 GB")).toBe(200);
      expect(percent(2048, 1024)).toBe(200);
    });
  });

  describe("mixed input types", () => {
    it("handles string and number inputs", () => {
      expect(percent("512 B", 1024)).toBe(50);
      expect(percent(512, "1 KiB")).toBe(50);
    });

    it("handles bigint inputs", () => {
      expect(percent(512n, 1024n)).toBe(50);
      expect(percent(512n, "1 KiB")).toBe(50);
    });
  });

  describe("edge cases", () => {
    it("returns 0 when both part and total are 0", () => {
      expect(percent(0, 0)).toBe(0);
    });

    it("returns Infinity when total is 0 but part is not", () => {
      expect(percent(100, 0)).toBe(Number.POSITIVE_INFINITY);
      expect(percent("1 KB", 0)).toBe(Number.POSITIVE_INFINITY);
    });

    it("handles very small percentages", () => {
      const result = percent("1 B", "1 GB");
      expect(result).toBeCloseTo((1 / 1_073_741_824) * 100, 10);
    });
  });

  describe("IEC vs JEDEC units", () => {
    it("correctly parses IEC units", () => {
      // 512 MiB out of 1 GiB = 50%
      expect(percent("512 MiB", "1 GiB")).toBe(50);
    });

    it("correctly handles different unit systems", () => {
      // 500 MB (JEDEC, 1024-based) out of 1 GB (JEDEC, 1024-based)
      // 500 * 1024^2 / 1024^3 = 500/1024 = 48.828125%
      const result = percent("500 MB", "1 GB");
      expect(result).toBeCloseTo(48.828_125, 5);
    });
  });
});

describe("percentOf", () => {
  describe("basic calculations", () => {
    it("calculates 50% of 1 GB", () => {
      const result = percentOf(50, "1 GiB");
      expect(result).toBe(536_870_912);
    });

    it("calculates 25% of 4 GB", () => {
      const result = percentOf(25, "4 GiB");
      expect(result).toBe(1_073_741_824);
    });

    it("calculates 100% returns full value", () => {
      expect(percentOf(100, "1 GiB")).toBe(1_073_741_824);
      expect(percentOf(100, 1024)).toBe(1024);
    });

    it("calculates 0% returns 0", () => {
      expect(percentOf(0, "1 GB")).toBe(0);
      expect(percentOf(0, 1024)).toBe(0);
    });
  });

  describe("with format option", () => {
    it("returns formatted string when format is true", () => {
      const result = percentOf(50, "1 GiB", { format: true });
      expect(result).toBe("512 MiB");
    });

    it("returns formatted string with custom system", () => {
      const result = percentOf(50, "1 GB", { format: true, system: "si" });
      expect(typeof result).toBe("string");
      expect(result).toContain("MB");
    });

    it("returns formatted string with decimals", () => {
      const result = percentOf(33.33, "1 GiB", { decimals: 2, format: true });
      expect(typeof result).toBe("string");
    });
  });

  describe("without format option", () => {
    it("returns bytes as number by default", () => {
      const result = percentOf(50, "1 GiB");
      expect(typeof result).toBe("number");
      expect(result).toBe(536_870_912);
    });
  });

  describe("edge cases", () => {
    it("handles percentages over 100%", () => {
      expect(percentOf(200, "1 GiB")).toBe(2_147_483_648);
    });

    it("handles very small percentages", () => {
      const result = percentOf(0.001, "1 GiB");
      expect(result).toBeCloseTo(10_737.418, 0);
    });

    it("handles negative percentages", () => {
      const result = percentOf(-50, "1 GiB");
      expect(result).toBe(-536_870_912);
    });
  });

  describe("mixed input types", () => {
    it("handles numeric total", () => {
      expect(percentOf(50, 1024)).toBe(512);
    });

    it("handles bigint total", () => {
      expect(percentOf(50, 1024n)).toBe(512);
    });
  });
});

describe("remaining", () => {
  describe("basic calculations", () => {
    it("calculates remaining space", () => {
      const result = remaining("300 MiB", "1 GiB");
      expect(result).toBe(1_073_741_824 - 314_572_800);
    });

    it("calculates remaining with numeric inputs", () => {
      expect(remaining(300, 1000)).toBe(700);
      expect(remaining(512, 1024)).toBe(512);
    });

    it("returns 0 when used equals total", () => {
      expect(remaining("1 GiB", "1 GiB")).toBe(0);
      expect(remaining(1024, 1024)).toBe(0);
    });

    it("returns full value when used is 0", () => {
      expect(remaining(0, "1 GiB")).toBe(1_073_741_824);
      expect(remaining("0 B", 1024)).toBe(1024);
    });
  });

  describe("with format option", () => {
    it("returns formatted string when format is true", () => {
      const result = remaining("256 MiB", "1 GiB", { format: true });
      expect(result).toBe("768 MiB");
    });

    it("returns formatted string with custom system", () => {
      const result = remaining("500 MB", "1 GB", {
        format: true,
        system: "jedec",
      });
      expect(typeof result).toBe("string");
    });

    it("returns formatted string with decimals", () => {
      const result = remaining("300 MiB", "1 GiB", {
        decimals: 1,
        format: true,
      });
      expect(typeof result).toBe("string");
    });
  });

  describe("without format option", () => {
    it("returns bytes as number by default", () => {
      const result = remaining("256 MiB", "1 GiB");
      expect(typeof result).toBe("number");
      expect(result).toBe(805_306_368);
    });
  });

  describe("negative remaining (overused)", () => {
    it("returns negative value when used exceeds total", () => {
      const result = remaining("2 GiB", "1 GiB");
      expect(result).toBe(-1_073_741_824);
    });

    it("formats negative remaining correctly", () => {
      const result = remaining("2 GiB", "1 GiB", { format: true });
      expect(result).toBe("-1 GiB");
    });
  });

  describe("mixed input types", () => {
    it("handles string and number inputs", () => {
      expect(remaining("512 B", 1024)).toBe(512);
      expect(remaining(512, "1 KiB")).toBe(512);
    });

    it("handles bigint inputs", () => {
      expect(remaining(512n, 1024n)).toBe(512);
      expect(remaining(512n, "1 KiB")).toBe(512);
    });
  });

  describe("edge cases", () => {
    it("handles zero total", () => {
      expect(remaining(0, 0)).toBe(0);
      expect(remaining(100, 0)).toBe(-100);
    });

    it("handles very small differences", () => {
      const result = remaining("1023 B", "1 KiB");
      expect(result).toBe(1);
    });
  });
});

describe("integration tests", () => {
  it("percent and percentOf are inverse operations", () => {
    const total = "1 GiB";
    const percentage = 25;

    const calculatedBytes = percentOf(percentage, total);
    const calculatedPercent = percent(calculatedBytes, total);

    expect(calculatedPercent).toBe(percentage);
  });

  it("remaining plus used equals total", () => {
    const total = "1 GiB";
    const used = "300 MiB";

    const remainingBytes = remaining(used, total);
    // 300 MiB in bytes
    const usedBytes = 314_572_800;
    // 1 GiB in bytes
    const totalBytes = 1_073_741_824;

    expect(remainingBytes + usedBytes).toBe(totalBytes);
  });

  it("percent of remaining equals 100 minus percent of used", () => {
    const total = "1 GiB";
    const used = "256 MiB";

    const usedPercent = percent(used, total);
    const remainingBytes = remaining(used, total);
    const remainingPercent = percent(remainingBytes, total);

    expect(usedPercent + remainingPercent).toBeCloseTo(100, 10);
  });
});
