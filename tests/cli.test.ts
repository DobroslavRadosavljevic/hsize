/**
 * CLI Tests for hsize
 *
 * These tests verify the CLI argument parsing logic.
 * For full integration tests, run the CLI manually:
 *
 * Manual Testing Commands:
 * ------------------------
 *
 * # Build first
 * bun run build
 *
 * # Test help
 * node dist/cli.mjs --help
 * node dist/cli.mjs -h
 *
 * # Test version
 * node dist/cli.mjs --version
 * node dist/cli.mjs -v
 *
 * # Test formatting bytes
 * node dist/cli.mjs 1073741824           # Expected: 1 GiB
 * node dist/cli.mjs 1000000000 -s si     # Expected: 1 GB
 * node dist/cli.mjs 1024 -s jedec        # Expected: 1 KB
 * node dist/cli.mjs 1536 -d 0            # Expected: 2 KiB
 * node dist/cli.mjs 1024 --bits          # Expected: 8 Kib
 *
 * # Test parsing to bytes
 * node dist/cli.mjs "1.5 GB" --to-bytes  # Expected: 1610612736
 * node dist/cli.mjs "1 KiB" -b           # Expected: 1024
 *
 * # Test compare command
 * node dist/cli.mjs compare "1 GB" "500 MB"  # Expected: 1 GiB > 500 MiB
 * node dist/cli.mjs compare "1 KiB" "1024"   # Expected: 1 KiB = 1 KiB
 *
 * # Test extract mode (stdin)
 * echo "Downloaded 1.5GB of 4GB" | node dist/cli.mjs --extract
 * # Expected:
 * # 1.5 GiB
 * # 4 GiB
 *
 * echo "File size: 500 MB" | node dist/cli.mjs -e
 * # Expected: 500 MiB
 *
 * # Test combined short flags
 * node dist/cli.mjs -hv   # Should show help (help takes precedence)
 *
 * # Test error handling
 * node dist/cli.mjs                       # Expected: error (no value)
 * node dist/cli.mjs "invalid"             # Expected: error (invalid input)
 * node dist/cli.mjs -s invalid 1024       # Expected: error (invalid system)
 * node dist/cli.mjs -d -1 1024            # Expected: error (invalid decimals)
 * node dist/cli.mjs compare "1 GB"        # Expected: error (missing second value)
 * echo "" | node dist/cli.mjs -e          # Expected: error (no values found)
 */

import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "..", "dist", "cli.mjs");

const runCli = (
  args: string[],
  input?: string
): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync("node", [CLI_PATH, ...args], {
    encoding: "utf8",
    input,
  });

  return {
    exitCode: result.status ?? 1,
    stderr: result.stderr?.trim() ?? "",
    stdout: result.stdout?.trim() ?? "",
  };
};

describe("CLI", () => {
  describe("help and version", () => {
    it("shows help with --help", () => {
      const result = runCli(["--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("hsize - Convert between bytes");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Options:");
    });

    it("shows help with -h", () => {
      const result = runCli(["-h"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("hsize - Convert between bytes");
    });

    it("shows version with --version", () => {
      const result = runCli(["--version"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^hsize v\d+\.\d+\.\d+$/);
    });

    it("shows version with -v", () => {
      const result = runCli(["-v"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^hsize v\d+\.\d+\.\d+$/);
    });
  });

  describe("format bytes", () => {
    it("formats bytes to human-readable (IEC default)", () => {
      const result = runCli(["1073741824"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1 GiB");
    });

    it("formats bytes with SI system", () => {
      const result = runCli(["1000000000", "-s", "si"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1 GB");
    });

    it("formats bytes with JEDEC system", () => {
      const result = runCli(["1024", "--system", "jedec"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1 KB");
    });

    it("formats bytes with custom decimals", () => {
      const result = runCli(["1536", "-d", "0"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("2 KiB");
    });

    it("formats bytes as bits", () => {
      const result = runCli(["1024", "--bits"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("8 Kib");
    });
  });

  describe("parse to bytes", () => {
    it("parses human-readable to bytes with --to-bytes", () => {
      const result = runCli(["1.5 GB", "--to-bytes"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1610612736");
    });

    it("parses human-readable to bytes with -b", () => {
      const result = runCli(["1 KiB", "-b"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1024");
    });
  });

  describe("compare command", () => {
    it("compares two values (greater)", () => {
      const result = runCli(["compare", "1 GB", "500 MB"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1 GiB > 500 MiB");
    });

    it("compares two values (less)", () => {
      const result = runCli(["compare", "500 MB", "1 GB"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("500 MiB < 1 GiB");
    });

    it("compares two equal values", () => {
      const result = runCli(["compare", "1 KiB", "1024"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1 KiB = 1 KiB");
    });

    it("fails when missing second value", () => {
      const result = runCli(["compare", "1 GB"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Compare requires two values");
    });
  });

  describe("extract mode", () => {
    it("extracts byte values from stdin", () => {
      const result = runCli(["--extract"], "Downloaded 1.5GB of 4GB");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("1.5 GiB\n4 GiB");
    });

    it("extracts byte values with -e", () => {
      const result = runCli(["-e"], "File size: 500 MB");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("500 MiB");
    });

    it("fails when no byte values found", () => {
      const result = runCli(["-e"], "No sizes here");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("No byte values found");
    });
  });

  describe("error handling", () => {
    it("shows error when no value provided", () => {
      const result = runCli([]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("No value provided");
    });

    it("shows error for invalid input", () => {
      const result = runCli(["invalid"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid input");
    });

    it("shows error for invalid system", () => {
      const result = runCli(["-s", "invalid", "1024"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid system");
    });

    it("shows error for negative decimals", () => {
      const result = runCli(["-d", "-1", "1024"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Decimals must be");
    });
  });
});
