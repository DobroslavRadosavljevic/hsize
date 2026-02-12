import type { FormatOptions } from "./types";

import { decimalToNumber, toDecimal } from "./decimal";
import { format } from "./format";
import { parse } from "./parse";

/**
 * Time interval for rate calculations.
 */
export type RateInterval = "second" | "minute" | "hour";

/**
 * Options for formatting byte rates.
 * Extends FormatOptions with rate-specific settings.
 */
export interface RateOptions extends FormatOptions {
  /**
   * Time interval for the rate.
   * @default "second"
   *
   * @example
   * formatRate(1024, { interval: "second" }); // "1 KiB/s"
   * formatRate(1024, { interval: "minute" }); // "1 KiB/min"
   * formatRate(1024, { interval: "hour" });   // "1 KiB/h"
   */
  interval?: RateInterval;

  /**
   * Format as bits per time unit (for network speeds).
   * @default false
   *
   * @example
   * formatRate(125000, { bits: true }); // "1 Mb/s" (1 Mbps)
   */
  bits?: boolean;
}

/**
 * Result of parsing a rate string.
 */
export interface ParsedRate {
  /** The rate converted to bytes per second */
  bytesPerSecond: number;
  /** The original rate value in the parsed unit */
  value: number;
  /** The unit string (e.g., "MB", "KiB") */
  unit: string;
  /** The time interval from the rate string */
  interval: RateInterval;
  /** Whether the rate was specified in bits */
  bits: boolean;
}

const INTERVAL_SUFFIXES: Record<RateInterval, string> = {
  hour: "/h",
  minute: "/min",
  second: "/s",
};

const INTERVAL_TO_SECONDS: Record<RateInterval, number> = {
  hour: 3600,
  minute: 60,
  second: 1,
};

const RATE_PATTERN =
  /^([+-]?\d*\.?\d+)\s*([a-zA-Z]+)\s*\/\s*(s|sec|second|min|minute|h|hr|hour)$/i;

const BPS_PATTERN = /^([+-]?\d*\.?\d+)\s*([a-zA-Z]+)(bps|bit\/s|bits\/s)$/i;

/**
 * Parse interval string to RateInterval type.
 */
const parseIntervalString = (intervalStr: string): RateInterval => {
  const normalized = intervalStr.toLowerCase();
  if (normalized === "s" || normalized === "sec" || normalized === "second") {
    return "second";
  }
  if (normalized === "min" || normalized === "minute") {
    return "minute";
  }
  if (normalized === "h" || normalized === "hr" || normalized === "hour") {
    return "hour";
  }
  return "second";
};

/**
 * Determine if a unit string represents bits.
 */
const isBitUnit = (unit: string): boolean => unit.endsWith("b");

const parseRateToBytes = (
  value: number,
  unit: string,
  interval: RateInterval
): { bits: boolean; bytesPerSecond: number } => {
  const bits = isBitUnit(unit);
  const bytesPerInterval = parse(
    `${value} ${unit}`,
    bits ? { bits: true } : {}
  );
  const divisor = INTERVAL_TO_SECONDS[interval];
  const bytesPerSecond = decimalToNumber(
    toDecimal(bytesPerInterval).div(divisor)
  );

  return { bits, bytesPerSecond };
};

/**
 * Parse and validate a numeric value from a string.
 */
const parseRateValue = (valueStr: string): number => {
  let value: number;
  try {
    value = decimalToNumber(toDecimal(valueStr));
  } catch {
    throw new TypeError(`Invalid rate value: ${valueStr}`);
  }

  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid rate value: ${valueStr}`);
  }
  return value;
};

/**
 * Parse a "bps" style rate string (e.g., "10 Mbps").
 */
const parseBpsRate = (match: RegExpExecArray): ParsedRate => {
  const [, valueStr, prefix] = match;
  const value = parseRateValue(valueStr);
  const bitUnit = `${prefix}b`;
  const { bits, bytesPerSecond } = parseRateToBytes(value, bitUnit, "second");

  return {
    bits,
    bytesPerSecond,
    interval: "second",
    unit: bitUnit,
    value,
  };
};

/**
 * Parse a standard rate string (e.g., "1 MB/s", "100 KiB/min").
 */
const parseStandardRate = (match: RegExpExecArray): ParsedRate => {
  const [, valueStr, unit, intervalStr] = match;
  const value = parseRateValue(valueStr);
  const interval = parseIntervalString(intervalStr);
  const { bits, bytesPerSecond } = parseRateToBytes(value, unit, interval);

  return {
    bits,
    bytesPerSecond,
    interval,
    unit,
    value,
  };
};

/**
 * Formats a byte rate value into a human-readable string representation.
 *
 * Converts raw bytes per second (or per other time interval) into formatted
 * strings with appropriate units (B/s, KB/s, MB/s, etc.).
 *
 * @param {number} bytesPerSecond - The rate in bytes per second.
 * @param {RateOptions} options - Rate formatting options.
 * @returns {string} Formatted rate string like "1.5 MB/s".
 *
 * @throws {TypeError} If `bytesPerSecond` is not a finite number.
 *
 * @example
 * // Basic usage - bytes per second
 * formatRate(1024);           // "1 KiB/s"
 * formatRate(1048576);        // "1 MiB/s"
 *
 * @example
 * // Different time intervals
 * formatRate(1024, { interval: "second" }); // "1 KiB/s"
 * formatRate(1024, { interval: "minute" }); // "1 KiB/min"
 * formatRate(1024, { interval: "hour" });   // "1 KiB/h"
 *
 * @example
 * // Network speeds in bits
 * formatRate(125000, { bits: true });                    // "1 Mb/s"
 * formatRate(125000000, { bits: true });                 // "1 Gb/s"
 * formatRate(125000, { bits: true, system: "si" });      // "1 Mb/s"
 *
 * @example
 * // Using different unit systems
 * formatRate(1000, { system: "si" });    // "1 kB/s"
 * formatRate(1024, { system: "iec" });   // "1 KiB/s"
 * formatRate(1024, { system: "jedec" }); // "1 KB/s"
 *
 * @example
 * // With formatting options
 * formatRate(1536, { decimals: 1 });           // "1.5 KiB/s"
 * formatRate(1024, { signed: true });          // "+1 KiB/s"
 * formatRate(1024, { space: false });          // "1KiB/s"
 */
export const formatRate = (
  bytesPerSecond: number,
  options: RateOptions = {}
): string => {
  const { interval = "second", ...formatOptions } = options;
  const multiplier = INTERVAL_TO_SECONDS[interval];
  const bytesPerInterval = decimalToNumber(
    toDecimal(bytesPerSecond).mul(multiplier)
  );
  const formatted = format(bytesPerInterval, formatOptions);
  const suffix = INTERVAL_SUFFIXES[interval];
  return `${formatted}${suffix}`;
};

/**
 * Parses a rate string into its byte-per-second equivalent.
 *
 * Converts strings like "1 MB/s", "10 Mbps", or "100 KiB/min" into
 * their bytes-per-second equivalents.
 *
 * @param {string} rateString - The rate string to parse.
 * @returns {ParsedRate} Parsed rate object with bytesPerSecond and metadata.
 *
 * @throws {TypeError} If the rate string format is invalid.
 *
 * @example
 * // Basic parsing
 * parseRate("1 KiB/s");     // { bytesPerSecond: 1024, ... }
 * parseRate("1 MB/s");      // { bytesPerSecond: 1048576, ... }
 *
 * @example
 * // Different intervals
 * parseRate("60 KiB/min");  // { bytesPerSecond: 1024, ... }
 * parseRate("3600 KiB/h");  // { bytesPerSecond: 1024, ... }
 *
 * @example
 * // Bit rates
 * parseRate("8 Kb/s");      // { bytesPerSecond: 1024, bits: true, ... }
 * parseRate("1 Mbps");      // { bytesPerSecond: 125000, bits: true, ... }
 */
export const parseRate = (rateString: string): ParsedRate => {
  const trimmed = rateString.trim();

  const bpsMatch = BPS_PATTERN.exec(trimmed);
  if (bpsMatch) {
    return parseBpsRate(bpsMatch);
  }

  const match = RATE_PATTERN.exec(trimmed);
  if (match) {
    return parseStandardRate(match);
  }

  throw new TypeError(`Invalid rate string format: ${rateString}`);
};
