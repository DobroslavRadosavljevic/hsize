import type { FormatOptions, HybridByte } from "./types";

import { decimalCmp, decimalToNumber, toDecimal } from "./decimal";
import { format } from "./format";
import { parse } from "./parse";

/**
 * Options for aggregate functions.
 */
export interface AggregateOptions extends FormatOptions {
  /**
   * When true, returns a formatted string instead of raw bytes.
   * @default false
   */
  format?: boolean;
}

/**
 * Conditional return type for aggregate functions based on the `format` option.
 */
export type AggregateReturn<T extends AggregateOptions> = T["format"] extends
  | true
  | "true"
  ? string
  : number;

/**
 * Converts a HybridByte value to bytes.
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
 * Converts an array of HybridByte values to bytes.
 */
const valuesToBytes = (values: HybridByte[]): number[] => values.map(toBytes);

/**
 * Formats the result if the format option is true.
 */
const maybeFormat = <T extends AggregateOptions>(
  bytes: number,
  options?: T
): AggregateReturn<T> => {
  if (options?.format) {
    const { format: _, ...formatOptions } = options;
    return format(bytes, formatOptions) as AggregateReturn<T>;
  }
  return bytes as AggregateReturn<T>;
};

/**
 * Calculates the sum of all byte values.
 *
 * Accepts an array of HybridByte values (number, bigint, or string) and returns
 * their sum in bytes. When the `format` option is true, returns a formatted string.
 *
 * @param values - Array of byte values to sum
 * @param options - Options for formatting the result
 * @returns The sum in bytes (number) or formatted string
 *
 * @example
 * // Basic sum returning bytes
 * sum(["1 GB", "500 MB", "256 KiB"]); // returns bytes as number
 *
 * @example
 * // Sum with formatted output
 * sum(["1 GB", "500 MB"], { format: true }); // "1.47 GiB"
 *
 * @example
 * // Sum with custom formatting options
 * sum(["1 GB", "2 GB"], { format: true, system: "si", decimals: 1 }); // "3.2 GB"
 *
 * @example
 * // Sum of numeric values
 * sum([1024, 2048, 4096]); // 7168
 */
export function sum(
  values: HybridByte[],
  options: AggregateOptions & { format: true }
): string;
export function sum(values: HybridByte[], options?: AggregateOptions): number;
export function sum(
  values: HybridByte[],
  options?: AggregateOptions
): number | string {
  if (values.length === 0) {
    return maybeFormat(0, options);
  }

  const bytesArray = valuesToBytes(values);
  let total = toDecimal(0);
  for (const value of bytesArray) {
    total = total.plus(value);
  }

  return maybeFormat(decimalToNumber(total), options);
}

/**
 * Calculates the average of all byte values.
 *
 * Accepts an array of HybridByte values (number, bigint, or string) and returns
 * their arithmetic mean in bytes. When the `format` option is true, returns a formatted string.
 *
 * @param values - Array of byte values to average
 * @param options - Options for formatting the result
 * @returns The average in bytes (number) or formatted string
 *
 * @example
 * // Basic average returning bytes
 * average(["1 GB", "2 GB", "3 GB"]); // returns bytes as number
 *
 * @example
 * // Average with formatted output
 * average(["1 GB", "2 GB", "3 GB"], { format: true }); // "1.86 GiB"
 *
 * @example
 * // Average with custom formatting options
 * average(["1 GiB", "2 GiB", "3 GiB"], { format: true, decimals: 0 }); // "2 GiB"
 *
 * @example
 * // Average of numeric values
 * average([1024, 2048, 4096]); // 2389.333...
 */
export function average(
  values: HybridByte[],
  options: AggregateOptions & { format: true }
): string;
export function average(
  values: HybridByte[],
  options?: AggregateOptions
): number;
export function average(
  values: HybridByte[],
  options?: AggregateOptions
): number | string {
  if (values.length === 0) {
    return maybeFormat(0, options);
  }

  const bytesArray = valuesToBytes(values);
  let total = toDecimal(0);
  for (const value of bytesArray) {
    total = total.plus(value);
  }
  const avg = decimalToNumber(total.div(values.length));

  return maybeFormat(avg, options);
}

/**
 * Calculates the median of all byte values.
 *
 * Accepts an array of HybridByte values (number, bigint, or string) and returns
 * the median value in bytes. For arrays with an even number of elements, returns
 * the average of the two middle values. When the `format` option is true, returns
 * a formatted string.
 *
 * @param values - Array of byte values to find median of
 * @param options - Options for formatting the result
 * @returns The median in bytes (number) or formatted string
 *
 * @example
 * // Basic median returning bytes
 * median(["1 GB", "2 GB", "10 GB"]); // returns 2GB in bytes
 *
 * @example
 * // Median with formatted output
 * median(["1 GB", "2 GB", "10 GB"], { format: true }); // "1.86 GiB"
 *
 * @example
 * // Median with even number of values (returns average of two middle values)
 * median(["1 GB", "2 GB", "3 GB", "4 GB"], { format: true }); // "2.33 GiB"
 *
 * @example
 * // Median of numeric values
 * median([1024, 2048, 4096]); // 2048
 */
export function median(
  values: HybridByte[],
  options: AggregateOptions & { format: true }
): string;
export function median(
  values: HybridByte[],
  options?: AggregateOptions
): number;
export function median(
  values: HybridByte[],
  options?: AggregateOptions
): number | string {
  if (values.length === 0) {
    return maybeFormat(0, options);
  }

  const bytesArray = valuesToBytes(values);
  const sorted = [...bytesArray].toSorted((a, b) => decimalCmp(a, b));
  const mid = Math.floor(sorted.length / 2);

  let medianValue: number;
  if (sorted.length % 2 === 0) {
    // Even number of elements: average of two middle values
    medianValue = decimalToNumber(
      toDecimal(sorted[mid - 1])
        .plus(sorted[mid])
        .div(2)
    );
  } else {
    // Odd number of elements: middle value
    medianValue = sorted[mid];
  }

  return maybeFormat(medianValue, options);
}
