import type { FormatOptions, HybridByte } from "./types";

import { decimalCmp } from "./decimal";
import { format } from "./format";
import { parse } from "./parse";
import { bigIntToSafeNumber } from "./utils";

/**
 * Default separator for range formatting (en-dash with spaces)
 */
const DEFAULT_SEPARATOR = " – ";

/**
 * Options for formatting byte ranges.
 *
 * Extends all standard format options with range-specific options.
 *
 * @example
 * formatRange(1024, 2048, { separator: " to " });  // "1 KiB to 2 KiB"
 * formatRange(1024, 1024, { collapse: false });    // "1 KiB – 1 KiB"
 */
export interface RangeOptions extends FormatOptions {
  /**
   * Separator string between min and max values.
   * @default " – " (en-dash with spaces)
   *
   * @example
   * formatRange(1024, 2048, { separator: " - " });   // "1 KiB - 2 KiB"
   * formatRange(1024, 2048, { separator: " to " });  // "1 KiB to 2 KiB"
   */
  separator?: string;

  /**
   * When true, collapses to a single value if min equals max.
   * @default true
   *
   * @example
   * formatRange(1024, 1024);                       // "1 KiB"
   * formatRange(1024, 1024, { collapse: false });  // "1 KiB – 1 KiB"
   */
  collapse?: boolean;
}

/**
 * Normalizes a hybrid byte value (number, bigint, or string) to bytes as a number.
 */
const normalizeToBytes = (value: HybridByte): number => {
  if (typeof value === "string") {
    return parse(value);
  }
  if (typeof value === "bigint") {
    return bigIntToSafeNumber(value);
  }
  return value;
};

/**
 * Extracts range-specific options from the combined options object.
 */
const extractRangeOptions = (
  options: RangeOptions
): { collapse: boolean; separator: string } => {
  const { collapse = true, separator = DEFAULT_SEPARATOR } = options;
  return { collapse, separator };
};

/**
 * Creates format options by removing range-specific options.
 */
const extractFormatOptions = (options: RangeOptions): FormatOptions => {
  const {
    collapse: _collapse,
    separator: _separator,
    ...formatOptions
  } = options;
  return formatOptions;
};

/**
 * Formats a byte range into a human-readable string representation.
 *
 * Accepts both numeric values (number, bigint) and string representations
 * (e.g., "1.5 GB", "100 MiB") for the min and max values.
 *
 * **Behavior:**
 * - When min equals max and `collapse` is true (default), returns a single formatted value
 * - Otherwise, returns "min – max" format with the specified separator
 * - Both values are formatted using the same options for consistency
 *
 * @param {HybridByte} min - The minimum value of the range. Can be a number, bigint, or byte string.
 * @param {HybridByte} max - The maximum value of the range. Can be a number, bigint, or byte string.
 * @param {RangeOptions} options - Formatting options including range-specific and standard format options.
 * @returns {string} Formatted range string.
 *
 * @throws {TypeError} If min or max is not a valid byte value.
 *
 * @example
 * // Basic usage with numbers
 * formatRange(1024, 2048);  // "1 KiB – 2 KiB"
 *
 * @example
 * // String inputs
 * formatRange("500 MB", "2 GB");  // "500 MB – 2 GB"
 *
 * @example
 * // Collapse when equal (default)
 * formatRange(1024, 1024);  // "1 KiB"
 *
 * @example
 * // Disable collapse
 * formatRange(1024, 1024, { collapse: false });  // "1 KiB – 1 KiB"
 *
 * @example
 * // Custom separator
 * formatRange(1024, 2048, { separator: " to " });  // "1 KiB to 2 KiB"
 *
 * @example
 * // With format options
 * formatRange(1024, 2048, { system: "si" });  // "1.02 kB – 2.05 kB"
 *
 * @example
 * // Mixed inputs
 * formatRange(1024, "2 KiB");  // "1 KiB – 2 KiB"
 */
export const formatRange = (
  min: HybridByte,
  max: HybridByte,
  options: RangeOptions = {}
): string => {
  const minBytes = normalizeToBytes(min);
  const maxBytes = normalizeToBytes(max);

  const { collapse, separator } = extractRangeOptions(options);
  const formatOptions = extractFormatOptions(options);

  // Collapse when min equals max
  if (collapse && decimalCmp(minBytes, maxBytes) === 0) {
    return format(minBytes, formatOptions);
  }

  const formattedMin = format(minBytes, formatOptions);
  const formattedMax = format(maxBytes, formatOptions);

  return `${formattedMin}${separator}${formattedMax}`;
};
