import { describe, expect, it, spyOn } from "bun:test";

import { format, parse } from "../src/index";

describe("parse", () => {
  describe("basic parsing", () => {
    it("parses bytes", () => {
      expect(parse("100 B")).toBe(100);
      expect(parse("100B")).toBe(100);
      expect(parse("100")).toBe(100);
    });

    it("parses kibibytes", () => {
      expect(parse("1 KiB")).toBe(1024);
      expect(parse("1KiB")).toBe(1024);
    });

    it("parses kilobytes", () => {
      expect(parse("1 kB")).toBe(1000);
      expect(parse("1kB")).toBe(1000);
      expect(parse("1 KB")).toBe(1024);
    });

    it("parses mebibytes", () => {
      expect(parse("1 MiB")).toBe(1_048_576);
    });

    it("parses megabytes", () => {
      expect(parse("1 MB")).toBe(1_048_576);
    });

    it("parses gibibytes", () => {
      expect(parse("1 GiB")).toBe(1_073_741_824);
    });

    it("parses tebibytes", () => {
      expect(parse("1 TiB")).toBe(1_099_511_627_776);
    });
  });

  describe("decimal values", () => {
    it("parses decimal values", () => {
      expect(parse("1.5 KiB")).toBe(1536);
      expect(parse("2.5 MiB")).toBe(2_621_440);
    });

    it("parses comma decimals", () => {
      expect(parse("1,5 KiB")).toBe(1536);
    });
  });

  describe("case insensitivity", () => {
    it("parses case-insensitively", () => {
      expect(parse("1 kib")).toBe(1024);
      expect(parse("1 KIB")).toBe(1024);
      expect(parse("1 Kib")).toBe(1024);
    });
  });

  describe("bits", () => {
    it("parses bits (lowercase b is treated as bytes)", () => {
      expect(parse("8 b")).toBe(8);
    });

    it("parses kibibits (currently treats as kibibytes)", () => {
      expect(parse("8 Kib")).toBe(8192);
    });
  });

  describe("number passthrough", () => {
    it("passes through numbers", () => {
      expect(parse(1024)).toBe(1024);
    });

    it("passes through BigInt", () => {
      expect(parse(1024n)).toBe(1024);
    });
  });

  describe("invalid input", () => {
    it("returns NaN for invalid input", () => {
      expect(parse("invalid")).toBeNaN();
      expect(parse("")).toBeNaN();
    });

    it("throws in strict mode", () => {
      expect(() => parse("invalid", { strict: true })).toThrow();
    });

    it("returns NaN for invalid number in string", () => {
      expect(parse("abc KiB")).toBeNaN();
    });

    it("throws in strict mode for invalid number", () => {
      expect(() => parse("abc KiB", { strict: true })).toThrow();
    });

    it("returns NaN for overflow values", () => {
      expect(parse("1e309 B")).toBeNaN();
      expect(parse("-1e309 B")).toBeNaN();
    });

    it("throws in strict mode for overflow values", () => {
      expect(() => parse("1e309 B", { strict: true })).toThrow(TypeError);
      expect(() => parse("-1e309 B", { strict: true })).toThrow(TypeError);
    });
  });

  describe("JEDEC units fallback", () => {
    it("parses TB as tebibytes (JEDEC)", () => {
      expect(parse("1 TB")).toBe(1_099_511_627_776);
    });

    it("parses PB as pebibytes (JEDEC)", () => {
      expect(parse("1 PB")).toBe(1_125_899_906_842_624);
    });
  });

  describe("SI units (lowercase)", () => {
    it("parses lowercase kB as SI (1000)", () => {
      expect(parse("1 kb")).toBe(1000);
    });

    it("parses mb as megabytes", () => {
      expect(parse("1 mb")).toBe(1_000_000);
    });
  });

  describe("units without prefix", () => {
    it("parses plain bytes", () => {
      expect(parse("500 b")).toBe(500);
      expect(parse("500 B")).toBe(500);
    });

    it("parses just a number", () => {
      expect(parse("1234")).toBe(1234);
    });
  });

  describe("UNIT_MAP lookup", () => {
    it("parses mib correctly from UNIT_MAP", () => {
      expect(parse("1 mib")).toBe(1_048_576);
    });

    it("parses gib correctly from UNIT_MAP", () => {
      expect(parse("1 gib")).toBe(1_073_741_824);
    });
  });
});

describe("parse round-trip consistency", () => {
  it("parse then format returns consistent value (IEC)", () => {
    expect(format(parse("1 KiB"))).toBe("1 KiB");
    expect(format(parse("1.5 MiB"))).toBe("1.5 MiB");
    expect(format(parse("2 GiB"))).toBe("2 GiB");
  });

  it("format then parse returns original bytes", () => {
    expect(parse(format(1024))).toBe(1024);
    expect(parse(format(1_572_864))).toBe(1_572_864);
    expect(parse(format(1_073_741_824))).toBe(1_073_741_824);
  });

  it("round-trip with SI system", () => {
    const formatted = format(1500, { system: "si" });
    expect(formatted).toBe("1.5 kB");
    expect(parse(formatted)).toBe(1500);
  });

  it("round-trip with decimal values", () => {
    const bytes = 1536;
    const formatted = format(bytes);
    expect(parse(formatted)).toBe(bytes);
  });

  it("round-trip preserves precision", () => {
    const bytes = 1_234_567_890;
    const formatted = format(bytes, { decimals: 4 });
    const parsed = parse(formatted);
    // Precision loss is expected due to unit conversion rounding
    expect(Math.abs(parsed - bytes)).toBeLessThan(100_000);
  });

  it("round-trip with all IEC units", () => {
    const values = [1024, 1_048_576, 1_073_741_824, 1_099_511_627_776];
    for (const v of values) {
      expect(parse(format(v))).toBe(v);
    }
  });

  it("round-trip with zero", () => {
    expect(parse(format(0))).toBe(0);
  });

  it("round-trip with negative values", () => {
    expect(parse(format(-1024))).toBe(-1024);
  });
});

describe("parse error messages", () => {
  it("throws TypeError with message for empty string in strict mode", () => {
    expect(() => parse("", { strict: true })).toThrow(TypeError);
    try {
      parse("", { strict: true });
    } catch (error) {
      expect((error as TypeError).message).toContain("Empty string");
    }
  });

  it("throws TypeError with input in message for invalid string", () => {
    try {
      parse("not a size", { strict: true });
    } catch (error) {
      expect((error as TypeError).message).toContain("Invalid byte string");
      expect((error as TypeError).message).toContain("not a size");
    }
  });

  it("throws specific error for whitespace-only input", () => {
    expect(() => parse("   ", { strict: true })).toThrow(TypeError);
  });

  it("returns NaN without strict mode (no throw)", () => {
    expect(parse("invalid")).toBeNaN();
    expect(parse("xyz")).toBeNaN();
    expect(parse("###")).toBeNaN();
  });
});

describe("SI vs JEDEC parsing", () => {
  it("parses lowercase kb as SI (1000)", () => {
    expect(parse("1 kb")).toBe(1000);
    expect(parse("1 mb")).toBe(1_000_000);
    expect(parse("1 gb")).toBe(1_000_000_000);
  });

  it("parses uppercase KB as JEDEC (1024)", () => {
    expect(parse("1 KB")).toBe(1024);
    expect(parse("1 MB")).toBe(1_048_576);
    expect(parse("1 GB")).toBe(1_073_741_824);
  });

  it("parses KiB as IEC (1024)", () => {
    expect(parse("1 KiB")).toBe(1024);
    expect(parse("1 MiB")).toBe(1_048_576);
  });

  it("parses TB and PB as JEDEC (1024-based)", () => {
    expect(parse("1 TB")).toBe(1_099_511_627_776);
    expect(parse("1 PB")).toBe(1_125_899_906_842_624);
  });

  it("parses lowercase tb and pb as SI (1000-based)", () => {
    expect(parse("1 tb")).toBe(1_000_000_000_000);
    expect(parse("1 pb")).toBe(1_000_000_000_000_000);
  });
});

const noop = (): void => {
  // intentionally empty - suppress console output in tests
};

describe("BigInt handling", () => {
  it("warns for BigInt exceeding safe integer range", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(noop);
    const huge = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    parse(huge);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("precision"));
    warnSpy.mockRestore();
  });

  it("does not warn for BigInt within safe range", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(noop);
    parse(1024n);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns for negative BigInt exceeding safe range", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(noop);
    const huge = BigInt(Number.MIN_SAFE_INTEGER) - 1n;
    parse(huge);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("precision"));
    warnSpy.mockRestore();
  });

  it("throws RangeError in strict mode for BigInt exceeding safe range", () => {
    const huge = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    expect(() => parse(huge, { strict: true })).toThrow(RangeError);
    expect(() => parse(huge, { strict: true })).toThrow("precision");
  });

  it("does not throw in strict mode for BigInt within safe range", () => {
    expect(() => parse(1024n, { strict: true })).not.toThrow();
    expect(parse(1024n, { strict: true })).toBe(1024);
  });

  it("throws RangeError in strict mode for negative BigInt exceeding safe range", () => {
    const huge = BigInt(Number.MIN_SAFE_INTEGER) - 1n;
    expect(() => parse(huge, { strict: true })).toThrow(RangeError);
  });
});

describe("strict mode for non-finite numbers", () => {
  it("returns NaN for NaN input without strict mode", () => {
    expect(parse(Number.NaN)).toBeNaN();
  });

  it("returns NaN for Infinity without strict mode", () => {
    expect(parse(Number.POSITIVE_INFINITY)).toBeNaN();
    expect(parse(Number.NEGATIVE_INFINITY)).toBeNaN();
  });

  it("returns the number for finite input", () => {
    expect(parse(1024)).toBe(1024);
    expect(parse(0)).toBe(0);
    expect(parse(-500)).toBe(-500);
  });
});

describe("French octet units", () => {
  it("parses all French octet units", () => {
    expect(parse("1 To")).toBe(1e12);
    expect(parse("1 Po")).toBe(1e15);
    expect(parse("1 Eo")).toBe(1e18);
    expect(parse("1 Zo")).toBe(1e21);
    expect(parse("1 Yo")).toBe(1e24);
  });
});
