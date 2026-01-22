import { describe, expect, it } from "bun:test";

import { create, extract, format, parse, unit } from "../src/index";

describe("real-world scenarios", () => {
  describe("file size reporting", () => {
    it("formats typical file sizes", () => {
      expect(format(4096)).toBe("4 KiB");
      expect(format(1_234_567)).toBe("1.18 MiB");
      expect(format(500_000_000)).toBe("476.84 MiB");
    });

    it("reports disk usage", () => {
      const used = 45_000_000_000;
      const total = 500_000_000_000;
      const usedStr = format(used);
      const totalStr = format(total);
      expect(usedStr).toContain("GiB");
      expect(totalStr).toContain("GiB");
    });

    it("handles empty file", () => {
      expect(format(0)).toBe("0 B");
    });

    it("handles very small files", () => {
      expect(format(1)).toBe("1 B");
      expect(format(100)).toBe("100 B");
    });
  });

  describe("network bandwidth", () => {
    it("formats bandwidth in bits (SI)", () => {
      const megabit = 1_000_000 / 8;
      expect(format(megabit, { bits: true, system: "si" })).toBe("1 Mb");
    });

    it("formats download speeds", () => {
      const bytesPerSec = 12_500_000;
      const bitsPerSec = format(bytesPerSec, { bits: true, system: "si" });
      expect(bitsPerSec).toContain("Mb");
    });

    it("calculates download time", () => {
      const fileSize = parse("1 GiB");
      const speedBytesPerSec = parse("10 MB") / 8;
      const seconds = fileSize / speedBytesPerSec;
      expect(seconds).toBeGreaterThan(0);
    });
  });

  describe("progress indicators", () => {
    it("tracks download progress", () => {
      const total = parse("500 MiB");
      const downloaded = parse("125 MiB");
      const percentage = (downloaded / total) * 100;
      expect(percentage).toBe(25);
    });

    it("formats remaining bytes", () => {
      const total = unit("1 GiB");
      const done = unit("750 MiB");
      const remaining = total.subtract(done.bytes);
      expect(remaining.toString()).toBe("274 MiB");
    });
  });

  describe("storage calculations", () => {
    it("calculates total from multiple files", () => {
      const files = ["10 MiB", "25 MiB", "100 MiB", "5 MiB"];
      const total = files.reduce((acc, f) => acc + parse(f), 0);
      expect(format(total)).toBe("140 MiB");
    });

    it("computes average file size", () => {
      const sizes = [1024, 2048, 4096, 8192];
      const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      expect(format(avg)).toBe("3.75 KiB");
    });
  });

  describe("text extraction scenarios", () => {
    it("extracts from log output", () => {
      const log = "Downloaded 150MB in 30s, 5MB/s average";
      const extracted = extract(log);
      expect(extracted.length).toBe(2);
    });

    it("extracts from system info", () => {
      const info = "RAM: 16 GiB, Disk: 512 GB free of 1 TB";
      const extracted = extract(info);
      expect(extracted.length).toBeGreaterThanOrEqual(2);
    });

    it("handles mixed units in text", () => {
      const text = "Upload: 100KB, Download: 5MB, Total: 5.1MB";
      const results = extract(text);
      expect(results.length).toBe(3);
    });
  });
});

describe("factory pattern scenarios", () => {
  it("creates SI-configured instance for marketing", () => {
    const marketing = create({ system: "si" });
    expect(marketing.format(1_000_000_000)).toBe("1 GB");
    expect(marketing.format(500_000_000_000)).toBe("500 GB");
  });

  it("creates IEC-configured instance for technical", () => {
    const technical = create({ system: "iec" });
    expect(technical.format(1_073_741_824)).toBe("1 GiB");
  });

  it("creates localized instance", () => {
    const german = create({ locale: "de-DE" });
    const result = german.format(1536);
    expect(result).toContain("1,5");
  });

  it("chains factory configurations", () => {
    // Note: create() starts fresh, doesn't inherit parent config
    const detailed = create({ decimals: 3, system: "si" });
    expect(detailed.format(1_234_567)).toBe("1.235 MB");
  });
});

describe("chainable unit scenarios", () => {
  it("calculates backup storage needs", () => {
    const daily = unit("500 MiB");
    const weekly = daily.multiply(7);
    const monthly = daily.multiply(30);
    expect(weekly.toString()).toContain("GiB");
    expect(monthly.toString()).toContain("GiB");
  });

  it("splits storage evenly", () => {
    const total = unit("1 TiB");
    const perUser = total.divide(100);
    expect(perUser.bytes).toBe(1_099_511_627_776 / 100);
  });

  it("aggregates multiple sources", () => {
    const result = unit("100 MiB").add("200 MiB").add("300 MiB");
    expect(result.toString()).toBe("600 MiB");
  });
});
