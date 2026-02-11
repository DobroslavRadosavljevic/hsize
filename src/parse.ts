import type { ParseOptions } from "./types";

import {
  BYTE_PATTERN,
  DEFAULT_PARSE_OPTIONS,
  JEDEC_STYLE_PATTERN,
  PREFIX_EXPONENTS,
  UNIT_MAP,
  UPPERCASE_PREFIX_PATTERN,
} from "./constants";
import { decimalToNumber, getDecimalPowers, toDecimal } from "./decimal";
import { parseLocaleNumber } from "./utils";

const parseNumber = (input: number, options: ParseOptions): number => {
  if (!Number.isFinite(input)) {
    if (options.strict) {
      throw new TypeError(`Expected finite number, got ${input}`);
    }
    return Number.NaN;
  }
  return input;
};

const parseBigInt = (input: bigint, options: ParseOptions = {}): number => {
  if (
    input > BigInt(Number.MAX_SAFE_INTEGER) ||
    input < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    if (options.strict) {
      throw new RangeError(
        "hsize: BigInt value exceeds safe integer range, precision would be lost"
      );
    }
    console.warn(
      "hsize: BigInt value exceeds safe integer range, precision may be lost"
    );
  }
  return Number(input);
};

/**
 * Parses a human-readable byte string or numeric value into a number of bytes.
 *
 * Converts strings like "1.5 GB", "100 MiB", or "2 TB" into their byte equivalents.
 * Also accepts numbers (passed through) and bigints (converted to number).
 *
 * **Unit System Behavior:**
 *
 * - **IEC units** (KiB, MiB, GiB, etc.): Always use 1024-based calculation.
 *   These are unambiguous and always binary.
 *
 * - **SI units** (kB, MB, GB with lowercase 'k' or explicit decimal context):
 *   Use 1000-based calculation when the unit clearly indicates SI.
 *
 * - **JEDEC/Ambiguous units** (KB, MB, GB with uppercase):
 *   Historically ambiguous. The `iec` option controls interpretation:
 *   - `iec: true` (default): Treats "KB", "MB" as 1024-based (JEDEC standard)
 *   - `iec: false`: Treats "KB", "MB" as 1000-based (SI interpretation)
 *
 * **Note on SI vs IEC:**
 * - SI (International System of Units): Uses powers of 1000 (kB = 1000 bytes)
 * - IEC (International Electrotechnical Commission): Uses powers of 1024 (KiB = 1024 bytes)
 * - JEDEC: Legacy standard using 1024 but with SI-style names (KB = 1024 bytes)
 *
 * @param {string | number | bigint} input - The value to parse. Can be:
 *                - A string like "1.5 GB", "100MiB", "2 TB"
 *                - A number (returned as-is if finite)
 *                - A bigint (converted to number, warns if precision loss)
 * @param {ParseOptions} [options] - Parsing options to control behavior.
 * @returns {number} The parsed value in bytes as a number.
 *          Returns NaN for invalid input (unless `strict: true`).
 *
 * @throws {TypeError} In strict mode, throws for invalid input:
 *                     - Empty strings
 *                     - Invalid byte string format
 *                     - Non-finite numbers
 * @throws {RangeError} In strict mode, throws when bigint exceeds safe integer range.
 *
 * @example
 * // Basic parsing
 * parse("1 KiB");     // 1024
 * parse("1 KB");      // 1024 (JEDEC interpretation by default)
 * parse("1.5 GiB");   // 1610612736
 * parse("100 MB");    // 104857600 (JEDEC, 1024-based)
 *
 * @example
 * // SI interpretation (1000-based)
 * parse("1 kB");                    // 1000 (lowercase 'k' indicates SI)
 * parse("1 KB", { iec: false });    // 1000 (force SI interpretation)
 * parse("100 MB", { iec: false });  // 100000000
 *
 * @example
 * // IEC units (always 1024-based)
 * parse("1 KiB");     // 1024 (unambiguous IEC)
 * parse("1 MiB");     // 1048576
 * parse("1 GiB");     // 1073741824
 *
 * @example
 * // Strict mode - throws on invalid input
 * parse("invalid", { strict: true }); // throws TypeError
 * parse("", { strict: true });        // throws TypeError
 *
 * @example
 * // Non-strict mode - returns NaN for invalid input
 * parse("invalid"); // NaN
 * parse("");        // NaN
 *
 * @example
 * // Numeric passthrough
 * parse(1024);           // 1024
 * parse(BigInt(1024));   // 1024
 *
 * @example
 * // Locale-aware parsing
 * parse("1,5 GiB", { locale: "de-DE" }); // 1610612736
 *
 * @example
 * // Various valid formats
 * parse("5GB");         // 5368709120 (no space)
 * parse("5 GB");        // 5368709120 (with space)
 * parse("5  GB");       // 5368709120 (multiple spaces)
 * parse("  5 GB  ");    // 5368709120 (trimmed)
 */
export const parse = (
  input: string | number | bigint,
  options: ParseOptions = {}
): number => {
  if (typeof input === "number") {
    return parseNumber(input, options);
  }

  if (typeof input === "bigint") {
    return parseBigInt(input, options);
  }

  return parseString(input, options);
};

const parseString = (input: string, options: ParseOptions): number => {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  const trimmed = input.trim();

  if (trimmed === "") {
    return handleInvalid(opts.strict, "Empty string");
  }

  const match = BYTE_PATTERN.exec(trimmed);

  if (!match) {
    return handleInvalid(opts.strict, `Invalid byte string: ${trimmed}`);
  }

  return processMatch(match, opts);
};

const handleInvalid = (
  strict: boolean | undefined,
  message: string
): number => {
  if (strict) {
    throw new TypeError(message);
  }
  return Number.NaN;
};

const processMatch = (match: RegExpExecArray, opts: ParseOptions): number => {
  const [, valueStr, rawUnit] = match;
  const unitStr = rawUnit ?? "b";

  // Regex match group guarantees valid number format, parseLocaleNumber always succeeds
  const value = parseLocaleNumber(valueStr, opts.locale);

  return calculateBytes(value, unitStr, opts);
};

const isJedecStyleUnit = (trimmedUnit: string): boolean =>
  JEDEC_STYLE_PATTERN.test(trimmedUnit) && !trimmedUnit.includes("i");

const hasUpperPrefix = (unit: string): boolean =>
  UPPERCASE_PREFIX_PATTERN.test(unit);

const calculateJedecBytes = (value: number, trimmedUnit: string): number => {
  const prefix = trimmedUnit.charAt(0).toLowerCase();
  const exponent = getExponentFromPrefix(prefix);
  return decimalToNumber(
    toDecimal(value).mul(getDecimalPowers(1024)[exponent])
  );
};

const calculateBytes = (
  value: number,
  unitStr: string,
  opts: ParseOptions
): number => {
  const trimmedUnit = unitStr.trim();
  const normalizedUnit = trimmedUnit.toLowerCase();

  if (isJedecStyleUnit(trimmedUnit) && hasUpperPrefix(trimmedUnit)) {
    return calculateJedecBytes(value, trimmedUnit);
  }

  const unitInfo = UNIT_MAP[normalizedUnit];
  if (unitInfo) {
    const rawValue = toDecimal(value).mul(
      getDecimalPowers(unitInfo.base)[unitInfo.exponent]
    );
    // Convert bits to bytes if the unit is a bit unit or opts.bits is true
    const isBitUnit = unitInfo.bits || opts.bits;
    return decimalToNumber(isBitUnit ? rawValue.div(8) : rawValue);
  }

  return calculateFromParts(value, normalizedUnit, opts);
};

const calculateFromParts = (
  value: number,
  unitStr: string,
  opts: ParseOptions
): number => {
  const hasI = unitStr.includes("i");
  const base = hasI || opts.iec ? 1024 : 1000;

  const prefix = unitStr.replaceAll(/[ibo]/gi, "").charAt(0).toLowerCase();
  const exponent = getExponentFromPrefix(prefix);

  const multiplier = getDecimalPowers(base)[exponent];
  return decimalToNumber(toDecimal(value).mul(multiplier));
};

const getExponentFromPrefix = (prefix: string): number =>
  PREFIX_EXPONENTS[prefix] ?? 0;
