import type { HybridByte } from "./types";

import { decimalCmp } from "./decimal";
import { parse } from "./parse";
import { bigIntToSafeNumber } from "./utils";

/**
 * Converts a HybridByte input to bytes for comparison.
 * Handles number, bigint, and string inputs.
 *
 * @param {HybridByte} value - The value to convert to bytes
 * @returns {number} The value in bytes as a number
 */
const toBytes = (value: HybridByte): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return bigIntToSafeNumber(value);
  }
  return parse(value);
};

/**
 * Checks if the first value is greater than the second.
 *
 * @param {HybridByte} a - First value (number, bigint, or string like "1 GB")
 * @param {HybridByte} b - Second value (number, bigint, or string like "1 GB")
 * @returns {boolean} true if a > b
 *
 * @example
 * gt("2 GB", "1 GB"); // true
 * gt(1024, "1 KiB");  // false (equal)
 * gt("1 MiB", 1000);  // true
 */
export const gt = (a: HybridByte, b: HybridByte): boolean =>
  decimalCmp(toBytes(a), toBytes(b)) > 0;

/**
 * Checks if the first value is greater than or equal to the second.
 *
 * @param {HybridByte} a - First value (number, bigint, or string like "1 GB")
 * @param {HybridByte} b - Second value (number, bigint, or string like "1 GB")
 * @returns {boolean} true if a >= b
 *
 * @example
 * gte("2 GB", "1 GB"); // true
 * gte(1024, "1 KiB");  // true (equal)
 * gte("500 B", 1000);  // false
 */
export const gte = (a: HybridByte, b: HybridByte): boolean =>
  decimalCmp(toBytes(a), toBytes(b)) >= 0;

/**
 * Checks if the first value is less than the second.
 *
 * @param {HybridByte} a - First value (number, bigint, or string like "1 GB")
 * @param {HybridByte} b - Second value (number, bigint, or string like "1 GB")
 * @returns {boolean} true if a < b
 *
 * @example
 * lt("500 MB", "1 GB"); // true
 * lt(1024, "1 KiB");    // false (equal)
 * lt("2 GiB", 1000);    // false
 */
export const lt = (a: HybridByte, b: HybridByte): boolean =>
  decimalCmp(toBytes(a), toBytes(b)) < 0;

/**
 * Checks if the first value is less than or equal to the second.
 *
 * @param {HybridByte} a - First value (number, bigint, or string like "1 GB")
 * @param {HybridByte} b - Second value (number, bigint, or string like "1 GB")
 * @returns {boolean} true if a <= b
 *
 * @example
 * lte("500 MB", "1 GB"); // true
 * lte(1024, "1 KiB");    // true (equal)
 * lte("2 GiB", 1000);    // false
 */
export const lte = (a: HybridByte, b: HybridByte): boolean =>
  decimalCmp(toBytes(a), toBytes(b)) <= 0;

/**
 * Checks if two values are equal in bytes.
 *
 * @param {HybridByte} a - First value (number, bigint, or string like "1 GB")
 * @param {HybridByte} b - Second value (number, bigint, or string like "1 GB")
 * @returns {boolean} true if a === b in bytes
 *
 * @example
 * eq("1 KiB", 1024);     // true
 * eq("1024 B", "1 KiB"); // true
 * eq("1 GB", "1 GiB");   // false (different bases)
 */
export const eq = (a: HybridByte, b: HybridByte): boolean =>
  decimalCmp(toBytes(a), toBytes(b)) === 0;

/**
 * Checks if a value is between a minimum and maximum (inclusive).
 *
 * @param {HybridByte} value - The value to check (number, bigint, or string like "1 GB")
 * @param {HybridByte} minValue - The minimum value (inclusive)
 * @param {HybridByte} maxValue - The maximum value (inclusive)
 * @returns {boolean} true if minValue <= value <= maxValue
 *
 * @example
 * between("500 MB", "100 MB", "1 GB"); // true
 * between("2 GB", "100 MB", "1 GB");   // false
 * between(1024, 0, "2 KiB");           // true
 */
export const between = (
  value: HybridByte,
  minValue: HybridByte,
  maxValue: HybridByte
): boolean => {
  const bytes = toBytes(value);
  return (
    decimalCmp(bytes, toBytes(minValue)) >= 0 &&
    decimalCmp(bytes, toBytes(maxValue)) <= 0
  );
};

/**
 * Returns the smallest value from a list of byte values.
 *
 * @param {HybridByte[]} values - Values to compare (number, bigint, or string like "1 GB")
 * @returns {number} The smallest value in bytes as a number
 * @throws {Error} If no values are provided
 *
 * @example
 * min("1 GB", "500 MB", "2 GB"); // 524288000 (500 MB in bytes)
 * min(1024, "2 KiB", 512);       // 512
 * min("1 MiB");                  // 1048576
 */
export const min = (...values: HybridByte[]): number => {
  if (values.length === 0) {
    throw new Error("min requires at least one argument");
  }
  let result = toBytes(values[0]);
  for (let i = 1; i < values.length; i += 1) {
    const bytes = toBytes(values[i]);
    if (decimalCmp(bytes, result) < 0) {
      result = bytes;
    }
  }
  return result;
};

/**
 * Returns the largest value from a list of byte values.
 *
 * @param {HybridByte[]} values - Values to compare (number, bigint, or string like "1 GB")
 * @returns {number} The largest value in bytes as a number
 * @throws {Error} If no values are provided
 *
 * @example
 * max("1 GB", "500 MB", "2 GB"); // 2147483648 (2 GB in bytes)
 * max(1024, "2 KiB", 512);       // 2048
 * max("1 MiB");                  // 1048576
 */
export const max = (...values: HybridByte[]): number => {
  if (values.length === 0) {
    throw new Error("max requires at least one argument");
  }
  let result = toBytes(values[0]);
  for (let i = 1; i < values.length; i += 1) {
    const bytes = toBytes(values[i]);
    if (decimalCmp(bytes, result) > 0) {
      result = bytes;
    }
  }
  return result;
};
