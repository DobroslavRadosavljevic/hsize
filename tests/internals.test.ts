import { describe, expect, it } from "bun:test";

import {
  applyRounding,
  calculateExponent,
  divide,
  formatNumber,
  isValidByteValue,
  parseLocaleNumber,
  resolveToBytes,
  roundToDecimals,
} from "../src/utils";

describe("parseLocaleNumber", () => {
  it("returns NaN for non-string input", () => {
    expect(parseLocaleNumber(123 as unknown as string)).toBeNaN();
    expect(parseLocaleNumber(null as unknown as string)).toBeNaN();
  });

  it("parses string without locale", () => {
    expect(parseLocaleNumber("1.5")).toBe(1.5);
    expect(parseLocaleNumber("1,5")).toBe(1.5);
  });

  it("parses string with locale false", () => {
    expect(parseLocaleNumber("1.5", false)).toBe(1.5);
  });

  it("parses with locale string", () => {
    expect(parseLocaleNumber("1,5", "de-DE")).toBe(1.5);
  });

  it("handles invalid locale gracefully", () => {
    const result = parseLocaleNumber("1.5", "invalid-locale-xyz");
    expect(result).toBe(1.5);
  });
});

describe("applyRounding", () => {
  it("applies floor rounding", () => {
    expect(applyRounding(1.7, "floor")).toBe(1);
  });

  it("applies ceil rounding", () => {
    expect(applyRounding(1.2, "ceil")).toBe(2);
  });

  it("applies trunc rounding", () => {
    expect(applyRounding(-1.7, "trunc")).toBe(-1);
  });

  it("applies round rounding by default", () => {
    expect(applyRounding(1.5)).toBe(2);
    expect(applyRounding(1.4)).toBe(1);
  });

  it("matches Math.round behavior for negative half values", () => {
    expect(applyRounding(-1.5)).toBe(-1);
    expect(applyRounding(-2.5)).toBe(-2);
  });
});

describe("roundToDecimals", () => {
  it("rounds to specified decimals", () => {
    expect(roundToDecimals(1.567, 2)).toBe(1.57);
    expect(roundToDecimals(1.564, 2)).toBe(1.56);
  });

  it("uses specified rounding method", () => {
    expect(roundToDecimals(1.555, 2, "floor")).toBe(1.55);
    expect(roundToDecimals(1.551, 2, "ceil")).toBe(1.56);
  });

  it("matches Math.round behavior for negative half decimals", () => {
    expect(roundToDecimals(-1.25, 1)).toBe(-1.2);
    expect(roundToDecimals(-2.35, 1)).toBe(-2.3);
  });
});

describe("formatNumber basic", () => {
  it("formats without options", () => {
    expect(formatNumber(1.5)).toBe("1.5");
  });

  it("formats with padding", () => {
    expect(formatNumber(1, { decimals: 2, pad: true })).toBe("1.00");
  });

  it("formats with thousands separator", () => {
    expect(formatNumber(1_234_567.89, { thousandsSeparator: "," })).toBe(
      "1,234,567.89"
    );
  });

  it("formats with locale string", () => {
    const result = formatNumber(1234.5, { locale: "de-DE" });
    expect(result).toContain("1");
  });

  it("formats with locale: true (uses browser default)", () => {
    const result = formatNumber(1234.5, { locale: true });
    expect(result).toContain("1");
  });

  it("handles locale format error gracefully", () => {
    const result = formatNumber(1.5, {
      locale: "invalid-locale-xyz",
    });
    expect(result).toBe("1.50");
  });
});

describe("formatNumber decimals", () => {
  it("formats with minimumFractionDigits", () => {
    const result = formatNumber(1, { decimals: 3, minimumFractionDigits: 3 });
    expect(result).toBe("1.000");
  });

  it("trims trailing zeros when not padding", () => {
    const result = formatNumber(1.1, { decimals: 3, pad: false });
    expect(result).toBe("1.1");
  });

  it("pads to minimumFractionDigits", () => {
    const result = formatNumber(1.1, {
      decimals: 4,
      minimumFractionDigits: 2,
      pad: false,
    });
    expect(result).toBe("1.10");
  });

  it("does not pad when current decimals exceed minimum", () => {
    const result = formatNumber(1.123, {
      decimals: 4,
      minimumFractionDigits: 2,
      pad: false,
    });
    expect(result).toBe("1.123");
  });

  it("returns early when minDecimals >= maxDecimals", () => {
    const result = formatNumber(1.1234, {
      decimals: 2,
      minimumFractionDigits: 3,
      pad: false,
    });
    expect(result).toBe("1.12");
  });

  it("handles whole numbers with minimumFractionDigits", () => {
    const result = formatNumber(1, {
      decimals: 4,
      minimumFractionDigits: 2,
      pad: false,
    });
    expect(result).toBe("1.00");
  });
});

describe("calculateExponent", () => {
  it("returns 0 for zero", () => {
    expect(calculateExponent(0, 1024, Math.log(1024))).toBe(0);
    expect(calculateExponent(0n, 1024, Math.log(1024))).toBe(0);
  });

  it("calculates exponent for numbers", () => {
    expect(calculateExponent(1024, 1024, Math.log(1024))).toBe(1);
    expect(calculateExponent(1_048_576, 1024, Math.log(1024))).toBe(2);
  });

  it("calculates exponent for bigints", () => {
    expect(calculateExponent(1024n, 1024, Math.log(1024))).toBe(1);
    expect(calculateExponent(1_048_576n, 1024, Math.log(1024))).toBe(2);
  });

  it("handles negative bigints", () => {
    expect(calculateExponent(-1024n, 1024, Math.log(1024))).toBe(1);
  });
});

describe("divide", () => {
  it("divides numbers", () => {
    expect(divide(1024, 1024, false)).toBe(1);
  });

  it("divides bigints", () => {
    expect(divide(1024n, 1024n, true)).toBe(1);
  });

  it("handles mixed types with bigint flag", () => {
    expect(divide(1024, 1024, true)).toBe(1);
  });
});

describe("isValidByteValue", () => {
  it("returns true for valid numbers", () => {
    expect(isValidByteValue(123)).toBe(true);
    expect(isValidByteValue(0)).toBe(true);
    expect(isValidByteValue(-123)).toBe(true);
  });

  it("returns true for bigints", () => {
    expect(isValidByteValue(123n)).toBe(true);
  });

  it("returns false for NaN", () => {
    expect(isValidByteValue(Number.NaN)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isValidByteValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidByteValue(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("returns false for non-numbers", () => {
    expect(isValidByteValue("123")).toBe(false);
    expect(isValidByteValue(null)).toBe(false);
    expect(isValidByteValue({})).toBe(false);
  });
});

const mockParse = (str: string) => {
  if (str === "1 KiB") {
    return 1024;
  }
  return Number.NaN;
};

describe("resolveToBytes", () => {
  it("resolves string values", () => {
    expect(resolveToBytes("1 KiB", mockParse)).toBe(1024);
  });

  it("resolves bigint values", () => {
    expect(resolveToBytes(1024n, mockParse)).toBe(1024);
  });

  it("resolves number values", () => {
    expect(resolveToBytes(1024, mockParse)).toBe(1024);
  });
});
