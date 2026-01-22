import { describe, expect, it, spyOn } from "bun:test";

import {
  bytes,
  eb,
  eib,
  format,
  gb,
  gib,
  kb,
  kib,
  mb,
  mib,
  parse,
  pb,
  pib,
  tb,
  tib,
  yb,
  yib,
  zb,
  zib,
} from "../src/index";
import { divide, resolveToBytes } from "../src/utils";

const noop = (): void => {
  // intentionally empty - suppress console output in tests
};

const mockParse = (str: string): number => {
  if (str === "1 KiB") {
    return 1024;
  }
  return Number.NaN;
};

describe("utility functions", () => {
  describe("SI units (1000-based)", () => {
    it("bytes returns identity", () => {
      expect(bytes(5)).toBe(5);
    });

    it("kb returns kilobytes", () => {
      expect(kb(1)).toBe(1000);
      expect(kb(5)).toBe(5000);
    });

    it("mb returns megabytes", () => {
      expect(mb(1)).toBe(1_000_000);
    });

    it("gb returns gigabytes", () => {
      expect(gb(1)).toBe(1_000_000_000);
    });

    it("tb returns terabytes", () => {
      expect(tb(1)).toBe(1_000_000_000_000);
    });

    it("pb returns petabytes", () => {
      expect(pb(1)).toBe(1_000_000_000_000_000);
    });

    it("eb returns exabytes", () => {
      expect(eb(1)).toBe(1e18);
    });

    it("zb returns zettabytes", () => {
      expect(zb(1)).toBe(1e21);
    });

    it("yb returns yottabytes", () => {
      expect(yb(1)).toBe(1e24);
    });
  });

  describe("IEC units (1024-based)", () => {
    it("kib returns kibibytes", () => {
      expect(kib(1)).toBe(1024);
      expect(kib(5)).toBe(5120);
    });

    it("mib returns mebibytes", () => {
      expect(mib(1)).toBe(1_048_576);
    });

    it("gib returns gibibytes", () => {
      expect(gib(1)).toBe(1_073_741_824);
    });

    it("tib returns tebibytes", () => {
      expect(tib(1)).toBe(1_099_511_627_776);
    });

    it("pib returns pebibytes", () => {
      expect(pib(1)).toBe(1_125_899_906_842_624);
    });

    it("eib returns exbibytes", () => {
      expect(eib(1)).toBe(1024 ** 6);
    });

    it("zib returns zebibytes", () => {
      expect(zib(1)).toBe(1024 ** 7);
    });

    it("yib returns yobibytes", () => {
      expect(yib(1)).toBe(1024 ** 8);
    });
  });
});

describe("format number options", () => {
  describe("locale formatting", () => {
    it("formats with locale true (uses default locale)", () => {
      const result = format(1536, { locale: true });
      expect(result).toContain("1");
      expect(result).toContain("KiB");
    });

    it("formats with specific locale", () => {
      const result = format(1536, { locale: "de-DE" });
      expect(result).toContain("1,5");
    });

    it("formats with locale array", () => {
      const result = format(1536, { locale: ["de-DE", "en-US"] });
      expect(result).toContain("1");
    });
  });

  describe("thousands separator", () => {
    it("adds thousands separator", () => {
      const result = format(1_048_576_000, { thousandsSeparator: "," });
      expect(result).toContain(",");
    });
  });

  describe("minimum/maximum fraction digits", () => {
    it("respects minimumFractionDigits", () => {
      const result = format(1024, { minimumFractionDigits: 2 });
      expect(result).toBe("1.00 KiB");
    });

    it("respects maximumFractionDigits", () => {
      const result = format(1536, { maximumFractionDigits: 1 });
      expect(result).toBe("1.5 KiB");
    });
  });

  describe("rounding methods", () => {
    it("uses floor rounding", () => {
      const result = format(1500, { decimals: 0, roundingMethod: "floor" });
      expect(result).toBe("1 KiB");
    });

    it("uses ceil rounding", () => {
      const result = format(1100, { decimals: 0, roundingMethod: "ceil" });
      expect(result).toBe("1 KiB");
    });

    it("uses trunc rounding", () => {
      const result = format(1900, { decimals: 0, roundingMethod: "trunc" });
      expect(result).toBe("2 KiB");
    });

    it("uses round rounding (default)", () => {
      const result = format(1536, { decimals: 0, roundingMethod: "round" });
      expect(result).toBe("2 KiB");
    });
  });

  describe("padding", () => {
    it("pads decimals when pad is true", () => {
      const result = format(1024, { decimals: 2, pad: true });
      expect(result).toBe("1.00 KiB");
    });
  });
});

describe("parse locale handling", () => {
  it("parses with locale string", () => {
    const result = parse("1,5 KiB", { locale: "de-DE" });
    expect(result).toBe(1536);
  });

  it("parses with locale true (uses comma as decimal)", () => {
    const result = parse("1,5 KiB", { locale: true });
    expect(result).toBe(1536);
  });

  it("parses numbers with thousands separators", () => {
    const result = parse("1.000 KiB", { locale: "de-DE" });
    expect(result).toBe(1_024_000);
  });
});

describe("divide utility function", () => {
  it("returns NaN when dividing by zero (number)", () => {
    expect(divide(1024, 0, false)).toBeNaN();
  });

  it("returns NaN when dividing by zero (bigint)", () => {
    expect(divide(1024n, 0n, true)).toBeNaN();
  });
});

describe("resolveToBytes utility function", () => {
  it("passes through numbers", () => {
    expect(resolveToBytes(1024, mockParse)).toBe(1024);
  });

  it("parses strings using provided parse function", () => {
    expect(resolveToBytes("1 KiB", mockParse)).toBe(1024);
  });

  it("converts BigInt to number", () => {
    expect(resolveToBytes(1024n, mockParse)).toBe(1024);
  });

  it("warns for BigInt exceeding safe integer range", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(noop);
    const huge = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    resolveToBytes(huge, mockParse);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("precision"));
    warnSpy.mockRestore();
  });

  it("throws RangeError in strict mode for BigInt exceeding safe range", () => {
    const huge = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    expect(() => resolveToBytes(huge, mockParse, { strict: true })).toThrow(
      RangeError
    );
    expect(() => resolveToBytes(huge, mockParse, { strict: true })).toThrow(
      "precision"
    );
  });

  it("does not warn or throw for BigInt within safe range", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(noop);
    expect(() =>
      resolveToBytes(1024n, mockParse, { strict: true })
    ).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
