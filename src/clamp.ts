import type { FormatOptions, HybridByte } from "./types";

import { format } from "./format";
import { parse } from "./parse";

/**
 * Options for clamping byte values to a specified range.
 *
 * Extends FormatOptions with clamp-specific options for min/max bounds.
 *
 * @example
 * clamp("500 KB", { min: "1 MB", max: "1 GB" });  // returns 1MB in bytes
 * clamp("500 KB", { min: "1 MB", max: "1 GB", format: true });  // "1 MB"
 */
export interface ClampOptions extends FormatOptions {
  /**
   * Minimum allowed value. Values below this will be clamped up.
   * Accepts byte strings (e.g., "100 MB") or numeric byte values.
   *
   * @example
   * clamp("50 MB", { min: "100 MB" });  // returns 100MB in bytes
   */
  min?: HybridByte;

  /**
   * Maximum allowed value. Values above this will be clamped down.
   * Accepts byte strings (e.g., "1 GB") or numeric byte values.
   *
   * @example
   * clamp("2 TB", { max: "1 GB" });  // returns 1GB in bytes
   */
  max?: HybridByte;

  /**
   * Return a formatted string instead of raw bytes.
   * When true, applies all FormatOptions to the result.
   * @default false
   *
   * @example
   * clamp("500 KB", { min: "1 MB", format: true });  // "1 MiB"
   */
  format?: boolean;
}

type ClampInput = HybridByte;

const normalizeInput = (value: ClampInput): number => {
  if (typeof value === "string") {
    return parse(value);
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
};

const validateBytes = (bytes: number): void => {
  if (!Number.isFinite(bytes)) {
    throw new TypeError(
      `Expected finite byte value, got non-finite number: ${bytes}`
    );
  }
};

const clampValue = (
  value: number,
  minBytes: number | undefined,
  maxBytes: number | undefined
): number => {
  const afterMin =
    minBytes !== undefined && value < minBytes ? minBytes : value;
  return maxBytes !== undefined && afterMin > maxBytes ? maxBytes : afterMin;
};

const normalizeAndValidateBound = (
  bound: HybridByte | undefined
): number | undefined => {
  if (bound === undefined) {
    return undefined;
  }
  const bytes = normalizeInput(bound);
  validateBytes(bytes);
  return bytes;
};

const computeClampedValue = (
  value: ClampInput,
  min: HybridByte | undefined,
  max: HybridByte | undefined
): number => {
  const bytes = normalizeInput(value);
  validateBytes(bytes);

  const minBytes = normalizeAndValidateBound(min);
  const maxBytes = normalizeAndValidateBound(max);

  return clampValue(bytes, minBytes, maxBytes);
};

/**
 * Clamps a byte value to a specified range.
 *
 * Constrains a byte value to fall within the specified minimum and maximum bounds.
 * Values below the minimum are raised to the minimum, and values above the maximum
 * are lowered to the maximum.
 *
 * Accepts either human-readable byte strings (e.g., "500 KB", "1 GiB") or
 * numeric byte values (number or bigint) for both the input value and bounds.
 *
 * @param {ClampInput} value - The byte value to clamp
 * @param {ClampOptions} [options] - Clamp options including min, max, and format settings
 * @returns {number | string} Clamped byte value (number) or formatted string if format: true
 *
 * @throws {TypeError} If the input value is not a finite number after parsing
 * @throws {TypeError} If min or max bounds are not finite numbers after parsing
 *
 * @example
 * // Basic clamping - returns bytes
 * clamp("500 KB", { min: "1 MB", max: "1 GB" });  // 1048576 (1MB in bytes)
 * clamp("2 TB", { max: "1 GB" });                  // 1073741824 (1GB in bytes)
 * clamp("500 MB", { min: "100 MB" });              // 524288000 (500MB unchanged)
 *
 * @example
 * // With format option - returns formatted string
 * clamp("500 KB", { min: "1 MB", max: "1 GB", format: true });  // "1 MiB"
 * clamp("2 TB", { max: "1 GB", format: true });                  // "1 GiB"
 *
 * @example
 * // Using numeric values
 * clamp(500000, { min: 1048576 });  // 1048576
 * clamp(1024, { max: 512 });        // 512
 *
 * @example
 * // With format options
 * clamp("500 KB", { min: "1 MB", format: true, system: "si" });  // "1 MB"
 * clamp("500 KB", { min: "1 MB", format: true, decimals: 3 });   // "1.000 MiB"
 *
 * @example
 * // Only min bound
 * clamp("50 MB", { min: "100 MB" });  // 104857600 (100MB)
 *
 * @example
 * // Only max bound
 * clamp("2 GB", { max: "1 GB" });  // 1073741824 (1GB)
 *
 * @example
 * // Value within range (unchanged)
 * clamp("500 MB", { min: "100 MB", max: "1 GB" });  // 524288000 (500MB)
 */
export function clamp(
  value: ClampInput,
  options: ClampOptions & { format: true }
): string;
export function clamp(
  value: ClampInput,
  options?: ClampOptions & { format?: false }
): number;
export function clamp(
  value: ClampInput,
  options?: ClampOptions
): number | string;
export function clamp(
  value: ClampInput,
  options: ClampOptions = {}
): number | string {
  const { min, max, format: shouldFormat = false, ...formatOpts } = options;
  const result = computeClampedValue(value, min, max);

  return shouldFormat ? format(result, formatOpts) : result;
}
