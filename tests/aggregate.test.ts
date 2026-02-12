import { describe, expect, it } from "bun:test";

import { average, median, sum } from "../src/index";

describe("sum", () => {
  describe("basic functionality", () => {
    it("sums numeric values", () => {
      const result = sum([1024, 2048, 4096]);
      expect(result).toBe(7168);
    });

    it("sums string values", () => {
      const result = sum(["1 KiB", "2 KiB", "3 KiB"]);
      expect(result).toBe(6144);
    });

    it("sums mixed values", () => {
      const result = sum([1024, "1 KiB", 1024n]);
      expect(result).toBe(3072);
    });

    it("sums different unit values", () => {
      // 1 GB (JEDEC) = 1073741824 bytes, 500 MB (JEDEC) = 524288000 bytes
      const result = sum(["1 GB", "500 MB"]);
      expect(result).toBe(1_073_741_824 + 524_288_000);
    });

    it("returns 0 for empty array", () => {
      const result = sum([]);
      expect(result).toBe(0);
    });

    it("handles single value", () => {
      const result = sum(["1 GiB"]);
      expect(result).toBe(1_073_741_824);
    });
  });

  describe("formatted output", () => {
    it("returns formatted string when format is true", () => {
      const result = sum(["1 GiB", "1 GiB"], { format: true });
      expect(result).toBe("2 GiB");
    });

    it("applies format options", () => {
      const result = sum(["1 GiB", "512 MiB"], { decimals: 1, format: true });
      expect(result).toBe("1.5 GiB");
    });

    it("supports SI system", () => {
      const result = sum([1000, 500], { format: true, system: "si" });
      expect(result).toBe("1.5 kB");
    });

    it("returns formatted 0 for empty array with format", () => {
      const result = sum([], { format: true });
      expect(result).toBe("0 B");
    });
  });

  describe("edge cases", () => {
    it("handles bigint values", () => {
      const result = sum([1024n, 2048n]);
      expect(result).toBe(3072);
    });

    it("handles large values", () => {
      const result = sum(["1 TiB", "1 TiB"]);
      expect(result).toBe(2 * 1024 ** 4);
    });
  });
});

describe("average", () => {
  describe("basic functionality", () => {
    it("calculates average of numeric values", () => {
      const result = average([1024, 2048, 4096]);
      expect(result).toBeCloseTo(2389.33, 1);
    });

    it("calculates average of string values", () => {
      const result = average(["1 KiB", "2 KiB", "3 KiB"]);
      expect(result).toBe(2048);
    });

    it("calculates average of mixed values", () => {
      const result = average([1024, "1 KiB", 1024n]);
      expect(result).toBe(1024);
    });

    it("returns 0 for empty array", () => {
      const result = average([]);
      expect(result).toBe(0);
    });

    it("handles single value", () => {
      const result = average(["1 GiB"]);
      expect(result).toBe(1_073_741_824);
    });
  });

  describe("formatted output", () => {
    it("returns formatted string when format is true", () => {
      const result = average(["1 GiB", "2 GiB", "3 GiB"], { format: true });
      expect(result).toBe("2 GiB");
    });

    it("applies format options", () => {
      const result = average(["1 GiB", "2 GiB"], {
        decimals: 1,
        format: true,
      });
      expect(result).toBe("1.5 GiB");
    });

    it("returns formatted 0 for empty array with format", () => {
      const result = average([], { format: true });
      expect(result).toBe("0 B");
    });
  });

  describe("edge cases", () => {
    it("handles bigint values", () => {
      const result = average([1024n, 3072n]);
      expect(result).toBe(2048);
    });
  });
});

describe("median", () => {
  describe("odd number of values", () => {
    it("returns middle value for odd count", () => {
      const result = median([1024, 2048, 4096]);
      expect(result).toBe(2048);
    });

    it("sorts values before finding median", () => {
      const result = median([4096, 1024, 2048]);
      expect(result).toBe(2048);
    });

    it("handles string values", () => {
      const result = median(["1 KiB", "2 KiB", "3 KiB"]);
      expect(result).toBe(2048);
    });

    it("returns middle of sorted string values", () => {
      // 1 GB = 1073741824, 2 GB = 2147483648, 10 GB = 10737418240
      const result = median(["1 GB", "2 GB", "10 GB"]);
      expect(result).toBe(2_147_483_648);
    });
  });

  describe("even number of values", () => {
    it("returns average of two middle values", () => {
      const result = median([1024, 2048, 3072, 4096]);
      expect(result).toBe(2560);
    });

    it("handles string values with even count", () => {
      const result = median(["1 GiB", "2 GiB", "3 GiB", "4 GiB"]);
      // Middle values: 2 GiB (2147483648) and 3 GiB (3221225472)
      // Average: 2684354560
      expect(result).toBe((2 * 1024 ** 3 + 3 * 1024 ** 3) / 2);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for empty array", () => {
      const result = median([]);
      expect(result).toBe(0);
    });

    it("handles single value", () => {
      const result = median(["1 GiB"]);
      expect(result).toBe(1_073_741_824);
    });

    it("handles two values", () => {
      const result = median([1024, 3072]);
      expect(result).toBe(2048);
    });
  });

  describe("formatted output", () => {
    it("returns formatted string when format is true", () => {
      const result = median(["1 GiB", "2 GiB", "3 GiB"], { format: true });
      expect(result).toBe("2 GiB");
    });

    it("applies format options", () => {
      const result = median(["1 GiB", "2 GiB", "2 GiB", "3 GiB"], {
        decimals: 0,
        format: true,
      });
      expect(result).toBe("2 GiB");
    });

    it("returns formatted 0 for empty array with format", () => {
      const result = median([], { format: true });
      expect(result).toBe("0 B");
    });
  });
});

describe("type inference", () => {
  it("returns number when format option is not provided", () => {
    const result = sum(["1 KiB"]);
    // TypeScript should infer this as number
    const _check: number = result;
    expect(typeof result).toBe("number");
  });

  it("returns string when format is true", () => {
    const result = sum(["1 KiB"], { format: true });
    // TypeScript should infer this as string
    const _check: string = result;
    expect(typeof result).toBe("string");
  });
});

describe("unsafe bigint handling", () => {
  const a = 2n ** 80n + 1n;
  const b = 2n ** 80n + 2n;

  it("throws RangeError for sum with out-of-safe-range bigint values", () => {
    expect(() => sum([a, b])).toThrow(RangeError);
  });

  it("throws RangeError for average with out-of-safe-range bigint values", () => {
    expect(() => average([a, b])).toThrow(RangeError);
  });

  it("throws RangeError for median with out-of-safe-range bigint values", () => {
    expect(() => median([a, b])).toThrow(RangeError);
  });
});
