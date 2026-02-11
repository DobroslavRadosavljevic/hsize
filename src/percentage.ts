import type { FormatOptions, HybridByte } from "./types";

import { decimalCmp, decimalToNumber, toDecimal } from "./decimal";
import { format } from "./format";
import { parse } from "./parse";

/**
 * Options for percentage calculation functions.
 */
export interface PercentageOptions extends FormatOptions {
  /**
   * If true, returns a formatted string instead of bytes.
   * @default false
   */
  format?: boolean;
}

/**
 * Resolves a hybrid byte value (string or number/bigint) to bytes.
 */
const toBytes = (value: HybridByte): number => {
  if (typeof value === "string") {
    return parse(value);
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
};

/**
 * Calculates what percentage `part` is of `total`.
 *
 * @param {HybridByte} part - The partial value (bytes, bigint, or human-readable string like "500 MB")
 * @param {HybridByte} total - The total value (bytes, bigint, or human-readable string like "1 GB")
 * @returns {number} The percentage as a number (0-100+)
 *
 * @example
 * percent("500 MB", "1 GB")  // 50
 * percent("1 GB", "4 GB")    // 25
 * percent(512, 1024)         // 50
 * percent("256 MiB", "1 GiB") // 25
 *
 * @example
 * // Edge cases
 * percent(0, "1 GB")         // 0
 * percent("1 GB", "1 GB")    // 100
 * percent("2 GB", "1 GB")    // 200 (can exceed 100%)
 */
export const percent = (part: HybridByte, total: HybridByte): number => {
  const partBytes = toBytes(part);
  const totalBytes = toBytes(total);

  if (decimalCmp(totalBytes, 0) === 0) {
    return decimalCmp(partBytes, 0) === 0 ? 0 : Number.POSITIVE_INFINITY;
  }

  return decimalToNumber(toDecimal(partBytes).div(totalBytes).mul(100));
};

/**
 * Calculates a percentage of a total size.
 *
 * @param percentage - The percentage to calculate (0-100+)
 * @param total - The total value (bytes, bigint, or human-readable string like "1 GB")
 * @param options - Optional formatting options
 * @returns The calculated bytes as a number, or a formatted string if `options.format` is true
 *
 * @example
 * percentOf(50, "1 GB")  // 536870912 (bytes)
 * percentOf(25, "4 GB")  // 1073741824 (bytes)
 *
 * @example
 * // With formatting
 * percentOf(50, "1 GB", { format: true })  // "512 MiB"
 * percentOf(25, "4 GB", { format: true })  // "1 GiB"
 *
 * @example
 * // With custom format options
 * percentOf(50, "1 GB", { format: true, system: "si" })  // "537 MB"
 * percentOf(25, "4 GB", { format: true, decimals: 1 })   // "1 GiB"
 */
export function percentOf(
  percentage: number,
  total: HybridByte,
  options: PercentageOptions & { format: true }
): string;
export function percentOf(
  percentage: number,
  total: HybridByte,
  options?: PercentageOptions
): number;
export function percentOf(
  percentage: number,
  total: HybridByte,
  options: PercentageOptions = {}
): number | string {
  const totalBytes = toBytes(total);
  const resultBytes = decimalToNumber(
    toDecimal(totalBytes).mul(percentage).div(100)
  );

  if (options.format) {
    const { format: _, ...formatOptions } = options;
    return format(resultBytes, formatOptions);
  }

  return resultBytes;
}

/**
 * Calculates the remaining space after subtracting used from total.
 *
 * @param used - The used value (bytes, bigint, or human-readable string like "300 MB")
 * @param total - The total value (bytes, bigint, or human-readable string like "1 GB")
 * @param options - Optional formatting options
 * @returns The remaining bytes as a number, or a formatted string if `options.format` is true
 *
 * @example
 * remaining("300 MB", "1 GB")  // returns bytes
 * remaining("700 MiB", "1 GiB") // returns bytes
 *
 * @example
 * // With formatting
 * remaining("300 MB", "1 GB", { format: true })  // "724.29 MiB" (approximately)
 * remaining("256 MiB", "1 GiB", { format: true }) // "768 MiB"
 *
 * @example
 * // Negative remaining (overused)
 * remaining("2 GB", "1 GB", { format: true })  // "-1 GiB"
 */
export function remaining(
  used: HybridByte,
  total: HybridByte,
  options: PercentageOptions & { format: true }
): string;
export function remaining(
  used: HybridByte,
  total: HybridByte,
  options?: PercentageOptions
): number;
export function remaining(
  used: HybridByte,
  total: HybridByte,
  options: PercentageOptions = {}
): number | string {
  const usedBytes = toBytes(used);
  const totalBytes = toBytes(total);
  const remainingBytes = decimalToNumber(
    toDecimal(totalBytes).minus(usedBytes)
  );

  if (options.format) {
    const { format: _, ...formatOptions } = options;
    return format(remainingBytes, formatOptions);
  }

  return remainingBytes;
}
