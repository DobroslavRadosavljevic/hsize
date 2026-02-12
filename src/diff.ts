import type { FormatOptions } from "./types";

import {
  decimalAbs,
  decimalCmp,
  decimalRound,
  decimalToNumber,
  toDecimal,
} from "./decimal";
import { format } from "./format";
import { parse } from "./parse";
import { bigIntToSafeNumber } from "./utils";

/**
 * Options for formatting the difference between two byte values.
 *
 * Extends FormatOptions with additional diff-specific options.
 *
 * @example
 * diff("1 GB", "1.5 GB", { percentage: true });  // "+500 MB (+50%)"
 * diff("1 GB", "1.5 GB", { signed: false });     // "500 MB"
 */
export interface DiffOptions extends FormatOptions {
  /**
   * Include percentage change in the output.
   * @default false
   *
   * @example
   * diff("1 GB", "2 GB", { percentage: true });  // "+1 GB (+100%)"
   * diff("2 GB", "1 GB", { percentage: true });  // "-1 GB (-50%)"
   */
  percentage?: boolean;

  /**
   * Always show +/- sign for the difference.
   * @default true
   *
   * @example
   * diff("1 GB", "1.5 GB");                    // "+500 MB"
   * diff("1 GB", "1.5 GB", { signed: false }); // "500 MB"
   */
  signed?: boolean;
}

type DiffInput = string | number | bigint;

const normalizeInput = (value: DiffInput): number => {
  if (typeof value === "string") {
    return parse(value);
  }
  if (typeof value === "bigint") {
    return bigIntToSafeNumber(value);
  }
  return value;
};

const formatZeroPercentage = (): string => "(0%)";

const formatInfinityPercentage = (diffBytes: number): string =>
  decimalCmp(diffBytes, 0) > 0 ? "(+Infinity%)" : "(-Infinity%)";

const formatSignedPercentage = (
  rounded: number,
  absRounded: number
): string => {
  const sign = decimalCmp(rounded, 0) > 0 ? "+" : "-";
  return `(${sign}${absRounded}%)`;
};

const computeRoundedPercent = (
  diffBytes: number,
  oldBytes: number
): { rounded: number; absRounded: number } => {
  const percentChange = toDecimal(diffBytes).div(oldBytes).mul(100);
  const rounded = decimalToNumber(decimalRound(percentChange, 2, "round"));
  const absRounded = decimalToNumber(decimalAbs(rounded));
  return { absRounded, rounded };
};

const formatPercentage = (
  oldBytes: number,
  diffBytes: number,
  signed: boolean
): string => {
  if (decimalCmp(oldBytes, 0) === 0) {
    return decimalCmp(diffBytes, 0) === 0
      ? formatZeroPercentage()
      : formatInfinityPercentage(diffBytes);
  }

  const { rounded, absRounded } = computeRoundedPercent(diffBytes, oldBytes);

  if (decimalCmp(rounded, 0) === 0) {
    return formatZeroPercentage();
  }

  return signed
    ? formatSignedPercentage(rounded, absRounded)
    : `(${absRounded}%)`;
};

const validateBytes = (oldBytes: number, newBytes: number): void => {
  if (!Number.isFinite(oldBytes) || !Number.isFinite(newBytes)) {
    throw new TypeError(
      "Expected finite byte values, got non-finite number(s)"
    );
  }
};

const formatDiffValue = (
  diffBytes: number,
  signed: boolean,
  formatOpts: FormatOptions
): string => {
  const absDiff = decimalToNumber(decimalAbs(diffBytes));
  const formattedDiff = format(absDiff, { ...formatOpts, signed: false });

  if (decimalCmp(diffBytes, 0) === 0 || !signed) {
    return formattedDiff;
  }

  const sign = decimalCmp(diffBytes, 0) > 0 ? "+" : "-";
  return `${sign}${formattedDiff}`;
};

/**
 * Formats the difference between two byte values as a human-readable string.
 *
 * Accepts either human-readable byte strings (e.g., "1 GB", "500 MiB") or
 * numeric byte values (number or bigint). The result shows the delta with
 * appropriate sign and optional percentage change.
 *
 * @param {DiffInput} oldValue - The original/starting byte value
 * @param {DiffInput} newValue - The new/ending byte value
 * @param {DiffOptions} [options] - Formatting options including diff-specific settings
 * @returns {string} Formatted difference string
 *
 * @example
 * // Basic usage
 * diff("1 GB", "1.5 GB");    // "+500 MB"
 * diff("2 GB", "1 GB");      // "-1 GB"
 * diff("1 GB", "1 GB");      // "0 B"
 *
 * @example
 * // With percentage
 * diff("1 GB", "1.5 GB", { percentage: true });  // "+500 MB (+50%)"
 * diff("1 GB", "2 GB", { percentage: true });    // "+1 GB (+100%)"
 *
 * @example
 * // Unsigned output
 * diff("1 GB", "1.5 GB", { signed: false });     // "500 MB"
 *
 * @example
 * // Using numeric values
 * diff(1024, 2048);          // "+1 KiB"
 * diff(1000, 2000, { system: "si" });  // "+1 kB"
 *
 * @example
 * // Custom formatting
 * diff("1 GB", "1.5 GB", { decimals: 3 });       // "+500 MB"
 * diff("1 GB", "1.5 GB", { system: "si" });      // "+500 MB"
 */
export const diff = (
  oldValue: DiffInput,
  newValue: DiffInput,
  options: DiffOptions = {}
): string => {
  const { percentage = false, signed = true, ...formatOpts } = options;

  const oldBytes = normalizeInput(oldValue);
  const newBytes = normalizeInput(newValue);
  validateBytes(oldBytes, newBytes);

  const diffBytes = decimalToNumber(toDecimal(newBytes).minus(oldBytes));
  const result = formatDiffValue(diffBytes, signed, formatOpts);

  if (!percentage) {
    return result;
  }

  const percentStr = formatPercentage(oldBytes, diffBytes, signed);
  return `${result} ${percentStr}`;
};
