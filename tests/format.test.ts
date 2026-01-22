import { describe, expect, it } from "bun:test";

import { format } from "../src/index";

describe("format", () => {
  describe("basic formatting", () => {
    it("formats 0 bytes", () => {
      expect(format(0)).toBe("0 B");
    });

    it("formats bytes", () => {
      expect(format(100)).toBe("100 B");
    });

    it("formats kibibytes (IEC default)", () => {
      expect(format(1024)).toBe("1 KiB");
    });

    it("formats mebibytes", () => {
      expect(format(1_048_576)).toBe("1 MiB");
    });

    it("formats gibibytes", () => {
      expect(format(1_073_741_824)).toBe("1 GiB");
    });

    it("formats with decimals", () => {
      expect(format(1536)).toBe("1.5 KiB");
      expect(format(1536, { decimals: 0 })).toBe("2 KiB");
      expect(format(1536, { decimals: 3 })).toBe("1.5 KiB");
    });
  });

  describe("SI system (1000-based)", () => {
    it("formats kilobytes", () => {
      expect(format(1000, { system: "si" })).toBe("1 kB");
    });

    it("formats megabytes", () => {
      expect(format(1_000_000, { system: "si" })).toBe("1 MB");
    });

    it("formats gigabytes", () => {
      expect(format(1_000_000_000, { system: "si" })).toBe("1 GB");
    });
  });

  describe("JEDEC system", () => {
    it("formats with JEDEC units", () => {
      expect(format(1024, { system: "jedec" })).toBe("1 KB");
      expect(format(1_048_576, { system: "jedec" })).toBe("1 MB");
    });
  });

  describe("bits", () => {
    it("formats as bits", () => {
      expect(format(1, { bits: true })).toBe("8 b");
      expect(format(1024, { bits: true })).toBe("8 Kib");
    });

    it("formats bits that overflow to next unit", () => {
      expect(format(128, { bits: true })).toBe("1 Kib");
      expect(format(131_072, { bits: true })).toBe("1 Mib");
    });

    it("formats bits with SI system", () => {
      expect(format(125, { bits: true, system: "si" })).toBe("1 kb");
    });
  });

  describe("output formats", () => {
    it("returns array output", () => {
      const result = format(1024, { output: "array" }) as unknown as [
        number,
        string,
      ];
      expect(result[0]).toBe(1);
      expect(result[1]).toBe("KiB");
    });

    it("returns object output", () => {
      const result = format(1024, { output: "object" }) as unknown as {
        bytes: number;
        exponent: number;
        unit: string;
        value: number;
      };
      expect(result.bytes).toBe(1024);
      expect(result.value).toBe(1);
      expect(result.unit).toBe("KiB");
      expect(result.exponent).toBe(1);
    });

    it("returns exponent output", () => {
      const result = format(1024, { output: "exponent" }) as unknown as number;
      expect(result).toBe(1);
    });
  });

  describe("options", () => {
    it("supports signed option", () => {
      expect(format(1024, { signed: true })).toBe("+1 KiB");
    });

    it("supports no space option", () => {
      expect(format(1024, { space: false })).toBe("1KiB");
    });

    it("supports custom spacer", () => {
      expect(format(1024, { spacer: "_" })).toBe("1_KiB");
    });

    it("supports fixed width", () => {
      expect(format(1024, { fixedWidth: 10 })).toBe("     1 KiB");
    });

    it("supports long form", () => {
      expect(format(1024, { longForm: true })).toBe("1 kibibyte");
      expect(format(2048, { longForm: true })).toBe("2 kibibytes");
    });

    it("supports force unit", () => {
      expect(format(1_048_576, { unit: "KiB" })).toBe("1024 KiB");
    });

    it("supports force unit with bytes", () => {
      expect(format(1024, { unit: "B" })).toBe("1024 B");
    });

    it("supports force exponent", () => {
      expect(format(1_048_576, { exponent: 1 })).toBe("1024 KiB");
    });

    it("supports localeOptions", () => {
      const result = format(1536, {
        locale: "en-US",
        localeOptions: { minimumFractionDigits: 2 },
      });
      expect(result).toContain("1.50");
    });
  });

  describe("negative values", () => {
    it("formats negative bytes", () => {
      expect(format(-1024)).toBe("-1 KiB");
    });
  });

  describe("BigInt support", () => {
    it("formats BigInt values", () => {
      expect(format(1024n)).toBe("1 KiB");
      expect(format(1_099_511_627_776n)).toBe("1 TiB");
    });

    it("formats negative BigInt values", () => {
      expect(format(-1024n)).toBe("-1 KiB");
      expect(format(-1_048_576n)).toBe("-1 MiB");
    });

    it("converts BigInt to number in object output", () => {
      const result = format(1024n, { output: "object" });
      expect(typeof result.bytes).toBe("number");
      expect(result.bytes).toBe(1024);
    });

    it("formats BigInt with SI system", () => {
      expect(format(1000n, { system: "si" })).toBe("1 kB");
    });
  });

  describe("localization", () => {
    it("formats with locale", () => {
      const result = format(1536, { locale: "de-DE" });
      expect(result).toContain("1,5");
    });
  });

  describe("edge cases", () => {
    it("handles zero", () => {
      expect(format(0)).toBe("0 B");
    });

    it("handles NaN", () => {
      expect(() => format(Number.NaN)).toThrow();
    });

    it("handles Infinity", () => {
      expect(() => format(Number.POSITIVE_INFINITY)).toThrow();
    });

    it("handles very large numbers", () => {
      const result = format(1e24);
      expect(result).toContain("ZiB");
    });

    it("formats yottabytes correctly", () => {
      expect(format(1024 ** 8)).toBe("1 YiB");
      expect(format(1e24, { system: "si" })).toBe("1 YB");
    });

    it("handles very small decimals", () => {
      expect(format(500)).toBe("500 B");
    });
  });
});

describe("format option combinations", () => {
  it("combines signed with SI system", () => {
    expect(format(1000, { signed: true, system: "si" })).toBe("+1 kB");
  });

  it("combines bits with signed", () => {
    expect(format(128, { bits: true, signed: true })).toBe("+1 Kib");
  });

  it("combines locale with decimals", () => {
    const result = format(1536, { decimals: 3, locale: "de-DE" });
    expect(result).toContain("1,5");
  });

  it("combines unit with space: false", () => {
    expect(format(1_048_576, { space: false, unit: "KiB" })).toBe("1024KiB");
  });

  it("combines fixedWidth with signed", () => {
    const result = format(1024, { fixedWidth: 12, signed: true });
    expect(result.length).toBe(12);
    expect(result).toContain("+");
  });

  it("handles extreme decimals value", () => {
    const result = format(1536, { decimals: 10 });
    expect(result).toBe("1.5 KiB");
  });

  it("handles large fixedWidth", () => {
    const result = format(1024, { fixedWidth: 50 });
    expect(result.length).toBe(50);
  });

  it("combines multiple options together", () => {
    const result = format(1500, {
      decimals: 2,
      signed: true,
      spacer: "-",
      system: "si",
    });
    expect(result).toBe("+1.5-kB");
  });
});

describe("format long-form", () => {
  it("formats singular byte", () => {
    expect(format(1, { longForm: true })).toBe("1 byte");
  });

  it("formats plural bytes", () => {
    expect(format(100, { longForm: true })).toBe("100 bytes");
  });

  it("formats all IEC units in long form", () => {
    expect(format(1024, { longForm: true })).toBe("1 kibibyte");
    expect(format(1_048_576, { longForm: true })).toBe("1 mebibyte");
    expect(format(1_073_741_824, { longForm: true })).toBe("1 gibibyte");
  });

  it("formats plural IEC units in long form", () => {
    expect(format(2048, { longForm: true })).toBe("2 kibibytes");
    expect(format(2_097_152, { longForm: true })).toBe("2 mebibytes");
  });

  it("formats SI units in long form", () => {
    expect(format(1000, { longForm: true, system: "si" })).toBe("1 kilobyte");
    expect(format(2000, { longForm: true, system: "si" })).toBe("2 kilobytes");
  });

  it("formats JEDEC units in long form", () => {
    expect(format(1024, { longForm: true, system: "jedec" })).toBe(
      "1 kilobyte"
    );
  });
});

describe("format boundary values", () => {
  it("formats just below KiB threshold", () => {
    expect(format(1023)).toBe("1023 B");
  });

  it("formats exactly at KiB threshold", () => {
    expect(format(1024)).toBe("1 KiB");
  });

  it("formats just above KiB threshold", () => {
    expect(format(1025)).toBe("1 KiB");
  });

  it("formats Number.MAX_SAFE_INTEGER", () => {
    const result = format(Number.MAX_SAFE_INTEGER);
    expect(result).toContain("PiB");
  });

  it("formats negative boundary values", () => {
    expect(format(-1023)).toBe("-1023 B");
    expect(format(-1024)).toBe("-1 KiB");
  });

  it("formats at each unit boundary", () => {
    expect(format(1024 ** 2 - 1)).toContain("KiB");
    expect(format(1024 ** 2)).toBe("1 MiB");
    expect(format(1024 ** 3)).toBe("1 GiB");
    expect(format(1024 ** 4)).toBe("1 TiB");
  });

  it("formats 1 byte correctly", () => {
    expect(format(1)).toBe("1 B");
  });

  it("formats fractional bytes", () => {
    expect(format(0.5)).toBe("0.5 B");
  });
});

describe("format locale tests", () => {
  it("formats with locale: true (system default)", () => {
    const result = format(1536, { locale: true });
    expect(result).toContain("1");
  });

  it("formats with French locale", () => {
    const result = format(1536, { locale: "fr-FR" });
    expect(result).toContain("1");
  });

  it("formats with locale array fallback", () => {
    const result = format(1536, { locale: ["de-DE", "en-US"] });
    expect(result).toContain("1");
  });
});

describe("format typed returns", () => {
  it("returns string by default", () => {
    const result = format(1024);
    expect(result).toBe("1 KiB");
  });

  it("returns HSizeObject when output is object", () => {
    const result = format(1024, { output: "object" });
    expect(result.bytes).toBe(1024);
    expect(result.value).toBe(1);
    expect(result.unit).toBe("KiB");
  });

  it("returns HSizeArray when output is array", () => {
    const result = format(1024, { output: "array" });
    expect(result[0]).toBe(1);
    expect(result[1]).toBe("KiB");
  });

  it("returns number when output is exponent", () => {
    const result = format(1024, { output: "exponent" });
    expect(result).toBe(1);
  });
});

describe("options validation", () => {
  it("throws for negative decimals", () => {
    expect(() => format(1024, { decimals: -1 })).toThrow(TypeError);
  });

  it("throws for non-finite decimals", () => {
    expect(() => format(1024, { decimals: Number.POSITIVE_INFINITY })).toThrow(
      TypeError
    );
    expect(() => format(1024, { decimals: Number.NaN })).toThrow(TypeError);
  });

  it("throws for invalid exponent (out of range)", () => {
    expect(() => format(1024, { exponent: 10 })).toThrow(TypeError);
    expect(() => format(1024, { exponent: -1 })).toThrow(TypeError);
    expect(() => format(1024, { exponent: 9 })).toThrow(TypeError);
  });

  it("throws for non-integer exponent (float values)", () => {
    expect(() => format(1024, { exponent: 1.5 })).toThrow(TypeError);
    expect(() => format(1024, { exponent: 2.7 })).toThrow(TypeError);
    expect(() => format(1024, { exponent: 0.1 })).toThrow(TypeError);
    expect(() => format(1024, { exponent: 1.5 })).toThrow(
      "exponent must be an integer between 0 and 8"
    );
  });

  it("accepts valid exponent values (0-8)", () => {
    expect(() => format(1024, { exponent: 0 })).not.toThrow();
    expect(() => format(1024, { exponent: 8 })).not.toThrow();
    expect(() => format(1024, { exponent: 4 })).not.toThrow();
  });

  it("throws for negative fixedWidth", () => {
    expect(() => format(1024, { fixedWidth: -5 })).toThrow(TypeError);
    expect(() => format(1024, { fixedWidth: -1 })).toThrow(TypeError);
  });

  it("accepts zero fixedWidth", () => {
    expect(() => format(1024, { fixedWidth: 0 })).not.toThrow();
  });
});

describe("negative zero handling", () => {
  it("formats negative zero as 0 B", () => {
    const result = format(-0);
    expect(result).toBe("0 B");
  });

  it("treats -0 and 0 the same", () => {
    expect(format(-0)).toBe(format(0));
  });

  it("handles negative zero with various options", () => {
    expect(format(-0, { system: "si" })).toBe("0 B");
    expect(format(-0, { bits: true })).toBe("0 b");
    expect(format(-0, { longForm: true })).toBe("0 bytes");
  });
});

describe("nonBreakingSpace option", () => {
  it("uses non-breaking space when nonBreakingSpace is true", () => {
    const result = format(1024, { nonBreakingSpace: true });
    expect(result).toBe("1\u00A0KiB");
  });
});

describe("rounding methods with array/object output", () => {
  it("applies rounding method to array output", () => {
    const result = format(1500, {
      decimals: 0,
      output: "array",
      roundingMethod: "floor",
    });
    expect(result[0]).toBe(1);
  });

  it("applies rounding method to object output", () => {
    const result = format(1500, {
      decimals: 0,
      output: "object",
      roundingMethod: "ceil",
    });
    expect(result.value).toBe(2);
  });
});

describe("signed option with zero", () => {
  it("does not add sign to zero with signed option", () => {
    expect(format(0, { signed: true })).toBe("0 B");
  });
});
