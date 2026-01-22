import { describe, expect, it } from "bun:test";

import { formatRate, parseRate } from "../src/index";

describe("formatRate", () => {
  describe("basic formatting", () => {
    it("formats bytes per second", () => {
      expect(formatRate(0)).toBe("0 B/s");
      expect(formatRate(100)).toBe("100 B/s");
      expect(formatRate(1024)).toBe("1 KiB/s");
      expect(formatRate(1_048_576)).toBe("1 MiB/s");
      expect(formatRate(1_073_741_824)).toBe("1 GiB/s");
    });

    it("formats with decimals", () => {
      expect(formatRate(1536)).toBe("1.5 KiB/s");
      expect(formatRate(1536, { decimals: 0 })).toBe("2 KiB/s");
      expect(formatRate(1536, { decimals: 3 })).toBe("1.5 KiB/s");
    });
  });

  describe("time intervals", () => {
    it("formats per second (default)", () => {
      expect(formatRate(1024, { interval: "second" })).toBe("1 KiB/s");
    });

    it("formats per minute", () => {
      expect(formatRate(1024, { interval: "minute" })).toBe("60 KiB/min");
    });

    it("formats per hour", () => {
      expect(formatRate(1024, { interval: "hour" })).toBe("3.52 MiB/h");
    });
  });

  describe("bits formatting", () => {
    it("formats as bits per second", () => {
      expect(formatRate(1, { bits: true })).toBe("8 b/s");
      expect(formatRate(128, { bits: true })).toBe("1 Kib/s");
    });

    it("formats megabits per second", () => {
      expect(formatRate(125_000, { bits: true, system: "si" })).toBe("1 Mb/s");
    });

    it("formats gigabits per second", () => {
      expect(formatRate(125_000_000, { bits: true, system: "si" })).toBe(
        "1 Gb/s"
      );
    });
  });

  describe("unit systems", () => {
    it("formats with SI system", () => {
      expect(formatRate(1000, { system: "si" })).toBe("1 kB/s");
      expect(formatRate(1_000_000, { system: "si" })).toBe("1 MB/s");
    });

    it("formats with IEC system (default)", () => {
      expect(formatRate(1024, { system: "iec" })).toBe("1 KiB/s");
    });

    it("formats with JEDEC system", () => {
      expect(formatRate(1024, { system: "jedec" })).toBe("1 KB/s");
    });
  });

  describe("formatting options", () => {
    it("supports signed option", () => {
      expect(formatRate(1024, { signed: true })).toBe("+1 KiB/s");
    });

    it("supports no space option", () => {
      expect(formatRate(1024, { space: false })).toBe("1KiB/s");
    });

    it("supports custom spacer", () => {
      expect(formatRate(1024, { spacer: "_" })).toBe("1_KiB/s");
    });

    it("supports locale formatting", () => {
      const result = formatRate(1536, { locale: "de-DE" });
      expect(result).toContain("1,5");
      expect(result).toContain("/s");
    });
  });

  describe("combined options", () => {
    it("combines bits with interval", () => {
      expect(formatRate(128, { bits: true, interval: "minute" })).toBe(
        "60 Kib/min"
      );
    });

    it("combines system with interval", () => {
      expect(formatRate(1000, { interval: "hour", system: "si" })).toBe(
        "3.6 MB/h"
      );
    });
  });
});

describe("parseRate", () => {
  describe("basic parsing", () => {
    it("parses bytes per second", () => {
      const result = parseRate("1 KiB/s");
      expect(result.bytesPerSecond).toBe(1024);
      expect(result.interval).toBe("second");
      expect(result.bits).toBe(false);
    });

    it("parses megabytes per second", () => {
      const result = parseRate("1 MiB/s");
      expect(result.bytesPerSecond).toBe(1_048_576);
    });

    it("parses gigabytes per second", () => {
      const result = parseRate("1 GiB/s");
      expect(result.bytesPerSecond).toBe(1_073_741_824);
    });
  });

  describe("time intervals", () => {
    it("parses per second variations", () => {
      expect(parseRate("1 KiB/s").bytesPerSecond).toBe(1024);
      expect(parseRate("1 KiB/sec").bytesPerSecond).toBe(1024);
      expect(parseRate("1 KiB/second").bytesPerSecond).toBe(1024);
    });

    it("parses per minute", () => {
      const result = parseRate("60 KiB/min");
      expect(result.bytesPerSecond).toBe(1024);
      expect(result.interval).toBe("minute");
    });

    it("parses per minute variations", () => {
      expect(parseRate("60 KiB/min").bytesPerSecond).toBe(1024);
      expect(parseRate("60 KiB/minute").bytesPerSecond).toBe(1024);
    });

    it("parses per hour", () => {
      const result = parseRate("3600 KiB/h");
      expect(result.bytesPerSecond).toBe(1024);
      expect(result.interval).toBe("hour");
    });

    it("parses per hour variations", () => {
      expect(parseRate("3600 KiB/h").bytesPerSecond).toBe(1024);
      expect(parseRate("3600 KiB/hr").bytesPerSecond).toBe(1024);
      expect(parseRate("3600 KiB/hour").bytesPerSecond).toBe(1024);
    });
  });

  describe("bit rates", () => {
    it("parses Mbps format", () => {
      const result = parseRate("10 Mbps");
      expect(result.bits).toBe(true);
      expect(result.interval).toBe("second");
      expect(result.bytesPerSecond).toBeCloseTo(1_250_000, 0);
    });

    it("parses Gbps format", () => {
      const result = parseRate("1 Gbps");
      expect(result.bits).toBe(true);
      expect(result.bytesPerSecond).toBeCloseTo(125_000_000, 0);
    });

    it("parses Kbps format", () => {
      const result = parseRate("8 Kbps");
      expect(result.bits).toBe(true);
      // 8 Kbps = 8000 bits/s = 1000 bytes/s (SI units)
      expect(result.bytesPerSecond).toBe(1000);
    });
  });

  describe("unit systems", () => {
    it("parses SI units", () => {
      expect(parseRate("1 kB/s").bytesPerSecond).toBe(1000);
      expect(parseRate("1 MB/s").bytesPerSecond).toBe(1_048_576);
    });

    it("parses IEC units", () => {
      expect(parseRate("1 KiB/s").bytesPerSecond).toBe(1024);
      expect(parseRate("1 MiB/s").bytesPerSecond).toBe(1_048_576);
    });
  });

  describe("decimal values", () => {
    it("parses decimal rates", () => {
      const result = parseRate("1.5 KiB/s");
      expect(result.bytesPerSecond).toBe(1536);
      expect(result.value).toBe(1.5);
    });

    it("parses large decimal rates", () => {
      const result = parseRate("2.5 GiB/s");
      expect(result.bytesPerSecond).toBe(2_684_354_560);
    });
  });

  describe("whitespace handling", () => {
    it("handles no space between value and unit", () => {
      expect(parseRate("1KiB/s").bytesPerSecond).toBe(1024);
    });

    it("handles extra whitespace", () => {
      expect(parseRate("  1 KiB / s  ").bytesPerSecond).toBe(1024);
    });
  });

  describe("error handling", () => {
    it("throws for invalid format", () => {
      expect(() => parseRate("invalid")).toThrow(TypeError);
    });

    it("throws for missing rate suffix", () => {
      expect(() => parseRate("1 KiB")).toThrow(TypeError);
    });

    it("throws for empty string", () => {
      expect(() => parseRate("")).toThrow(TypeError);
    });
  });

  describe("return value structure", () => {
    it("returns complete ParsedRate object", () => {
      const result = parseRate("1.5 MiB/min");
      expect(result).toHaveProperty("bytesPerSecond");
      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("unit");
      expect(result).toHaveProperty("interval");
      expect(result).toHaveProperty("bits");
    });

    it("returns correct value field", () => {
      const result = parseRate("2.5 GiB/s");
      expect(result.value).toBe(2.5);
    });

    it("returns correct unit field", () => {
      const result = parseRate("1 MiB/s");
      expect(result.unit).toBe("MiB");
    });
  });
});

describe("formatRate and parseRate roundtrip", () => {
  it("roundtrips basic rates", () => {
    const original = 1024;
    const formatted = formatRate(original);
    const parsed = parseRate(formatted);
    expect(parsed.bytesPerSecond).toBe(original);
  });

  it("roundtrips with SI system", () => {
    const original = 1000;
    const formatted = formatRate(original, { system: "si" });
    const parsed = parseRate(formatted);
    expect(parsed.bytesPerSecond).toBe(original);
  });

  it("roundtrips minute intervals", () => {
    const original = 1024;
    const formatted = formatRate(original, { interval: "minute" });
    const parsed = parseRate(formatted);
    expect(parsed.bytesPerSecond).toBeCloseTo(original, 0);
  });
});
