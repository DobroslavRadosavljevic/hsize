import { describe, expect, it } from "bun:test";

import {
  format,
  formatCompact,
  formatFile,
  formatMemory,
  formatNetwork,
  formatPrecise,
  formatStorage,
  presets,
} from "../src/index";

describe("presets", () => {
  describe("presets object", () => {
    it("has all expected presets", () => {
      expect(presets.storage).toBeDefined();
      expect(presets.memory).toBeDefined();
      expect(presets.network).toBeDefined();
      expect(presets.compact).toBeDefined();
      expect(presets.precise).toBeDefined();
      expect(presets.file).toBeDefined();
    });

    it("storage preset has correct options", () => {
      expect(presets.storage.system).toBe("si");
      expect(presets.storage.decimals).toBe(1);
    });

    it("memory preset has correct options", () => {
      expect(presets.memory.system).toBe("iec");
      expect(presets.memory.decimals).toBe(2);
    });

    it("network preset has correct options", () => {
      expect(presets.network.bits).toBe(true);
      expect(presets.network.system).toBe("si");
      expect(presets.network.decimals).toBe(1);
    });

    it("compact preset has correct options", () => {
      expect(presets.compact.space).toBe(false);
      expect(presets.compact.decimals).toBe(0);
    });

    it("precise preset has correct options", () => {
      expect(presets.precise.decimals).toBe(4);
      expect(presets.precise.pad).toBe(true);
    });

    it("file preset has correct options", () => {
      expect(presets.file.system).toBe("iec");
      expect(presets.file.decimals).toBe(2);
      expect(presets.file.longForm).toBe(false);
    });
  });

  describe("using presets with format", () => {
    it("works with storage preset", () => {
      expect(format(1000, presets.storage)).toBe("1 kB");
      expect(format(1_500_000, presets.storage)).toBe("1.5 MB");
    });

    it("works with memory preset", () => {
      expect(format(1024, presets.memory)).toBe("1 KiB");
      expect(format(1_073_741_824, presets.memory)).toBe("1 GiB");
    });

    it("works with network preset", () => {
      expect(format(125, presets.network)).toBe("1 kb");
      expect(format(125_000, presets.network)).toBe("1 Mb");
    });

    it("works with compact preset", () => {
      expect(format(1024, presets.compact)).toBe("1KiB");
      expect(format(1_073_741_824, presets.compact)).toBe("1GiB");
    });

    it("works with precise preset", () => {
      expect(format(1024, presets.precise)).toBe("1.0000 KiB");
      expect(format(1536, presets.precise)).toBe("1.5000 KiB");
    });

    it("works with file preset", () => {
      expect(format(1024, presets.file)).toBe("1 KiB");
      expect(format(1_073_741_824, presets.file)).toBe("1 GiB");
    });
  });

  describe("formatStorage", () => {
    it("formats bytes using SI system with up to 1 decimal", () => {
      expect(formatStorage(1000)).toBe("1 kB");
      expect(formatStorage(1_500_000)).toBe("1.5 MB");
      expect(formatStorage(1_000_000_000)).toBe("1 GB");
    });

    it("handles small values", () => {
      expect(formatStorage(500)).toBe("500 B");
    });

    it("handles large values", () => {
      expect(formatStorage(1_000_000_000_000)).toBe("1 TB");
    });
  });

  describe("formatMemory", () => {
    it("formats bytes using IEC system with up to 2 decimals", () => {
      expect(formatMemory(1024)).toBe("1 KiB");
      expect(formatMemory(1_073_741_824)).toBe("1 GiB");
      expect(formatMemory(2_147_483_648)).toBe("2 GiB");
    });

    it("handles fractional values", () => {
      expect(formatMemory(1536)).toBe("1.5 KiB");
    });
  });

  describe("formatNetwork", () => {
    it("formats bytes as bits using SI system", () => {
      expect(formatNetwork(125)).toBe("1 kb");
      expect(formatNetwork(125_000)).toBe("1 Mb");
      expect(formatNetwork(125_000_000)).toBe("1 Gb");
    });

    it("converts bytes to bits correctly", () => {
      // 1 byte = 8 bits
      expect(formatNetwork(1)).toBe("8 b");
    });
  });

  describe("formatCompact", () => {
    it("formats without space and no decimals", () => {
      expect(formatCompact(1024)).toBe("1KiB");
      expect(formatCompact(1_073_741_824)).toBe("1GiB");
    });

    it("rounds values", () => {
      expect(formatCompact(1536)).toBe("2KiB");
    });
  });

  describe("formatPrecise", () => {
    it("formats with 4 decimal places and padding", () => {
      expect(formatPrecise(1024)).toBe("1.0000 KiB");
      expect(formatPrecise(1536)).toBe("1.5000 KiB");
    });

    it("shows trailing zeros", () => {
      expect(formatPrecise(1_048_576)).toBe("1.0000 MiB");
    });
  });

  describe("formatFile", () => {
    it("formats bytes using IEC system with up to 2 decimals", () => {
      expect(formatFile(1024)).toBe("1 KiB");
      expect(formatFile(1_073_741_824)).toBe("1 GiB");
    });

    it("is equivalent to memory preset", () => {
      const bytes = 1_536_000;
      expect(formatFile(bytes)).toBe(formatMemory(bytes));
    });
  });

  describe("edge cases", () => {
    it("handles zero", () => {
      expect(formatStorage(0)).toBe("0 B");
      expect(formatMemory(0)).toBe("0 B");
      expect(formatNetwork(0)).toBe("0 b");
      expect(formatCompact(0)).toBe("0B");
    });

    it("handles bigint", () => {
      expect(formatStorage(1000n)).toBe("1 kB");
      expect(formatMemory(1024n)).toBe("1 KiB");
    });

    it("handles negative values", () => {
      expect(formatStorage(-1000)).toBe("-1 kB");
      expect(formatMemory(-1024)).toBe("-1 KiB");
    });
  });
});
