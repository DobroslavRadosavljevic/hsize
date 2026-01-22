import type {
  ByteValue,
  FormatOptions,
  FormatReturn,
  HSizeArray,
  HSizeObject,
} from "./types";

import { format } from "./format";

/**
 * Return type for the partially applied format function.
 *
 * When base options have a specific output type, the return type is fixed.
 * When override options can change the output type, the return type is inferred.
 */
type PartialFormatReturn<
  TBase extends FormatOptions,
  TOverride extends FormatOptions | undefined,
> = TOverride extends FormatOptions
  ? TOverride["output"] extends "object"
    ? HSizeObject
    : TOverride["output"] extends "array"
      ? HSizeArray
      : TOverride["output"] extends "exponent"
        ? number
        : TBase["output"] extends "object"
          ? HSizeObject
          : TBase["output"] extends "array"
            ? HSizeArray
            : TBase["output"] extends "exponent"
              ? number
              : string
  : FormatReturn<TBase>;

/**
 * A partially applied format function with pre-configured options.
 *
 * The function accepts a byte value and optional override options.
 * Override options are merged with the base options, with overrides taking precedence.
 */
export interface PartialFormatter<TBase extends FormatOptions> {
  /**
   * Format a byte value using pre-configured options.
   * @param bytes - The byte value to format
   * @returns Formatted result based on the configured output option
   */
  (bytes: ByteValue): FormatReturn<TBase>;

  /**
   * Format a byte value with override options.
   * @param bytes - The byte value to format
   * @param overrideOptions - Options to override the base configuration
   * @returns Formatted result based on the merged options
   */
  <TOverride extends FormatOptions>(
    bytes: ByteValue,
    overrideOptions: TOverride
  ): PartialFormatReturn<TBase, TOverride>;
}

/**
 * Creates a partially applied format function with pre-configured options.
 *
 * This is useful when you need to format multiple values with the same options,
 * avoiding the need to pass the same options repeatedly.
 *
 * The returned function accepts a byte value and optional override options.
 * Override options are merged with the base options, with overrides taking precedence.
 *
 * @param baseOptions - Default options for the formatter
 * @returns A pre-configured format function
 *
 * @example
 * // Create a storage formatter with SI units and 1 decimal place
 * const formatStorage = partial({ system: "si", decimals: 1 });
 * formatStorage(1500000000);  // "1.5 GB"
 * formatStorage(2500000);     // "2.5 MB"
 *
 * @example
 * // Create a formatter with specific output format
 * const formatAsArray = partial({ output: "array" });
 * formatAsArray(1024);  // [1, "KiB"]
 *
 * @example
 * // Override options per-call
 * const formatSI = partial({ system: "si" });
 * formatSI(1000);                    // "1 kB"
 * formatSI(1000, { decimals: 3 });   // "1 kB" (with 3 decimal places)
 * formatSI(1000, { system: "iec" }); // "1000 B" (overrides to IEC)
 *
 * @example
 * // Create a bits formatter
 * const formatBits = partial({ bits: true, system: "si" });
 * formatBits(125);  // "1 kb"
 *
 * @example
 * // Create a locale-aware formatter
 * const formatDE = partial({ locale: "de-DE", decimals: 2 });
 * formatDE(1536);  // "1,50 KiB"
 */
export function partial<TBase extends FormatOptions>(
  baseOptions: TBase
): PartialFormatter<TBase>;
export function partial(
  baseOptions: FormatOptions = {}
): PartialFormatter<FormatOptions> {
  const formatter = <TOverride extends FormatOptions>(
    bytes: ByteValue,
    overrideOptions?: TOverride
  ): FormatReturn<FormatOptions> => {
    const mergedOptions = overrideOptions
      ? { ...baseOptions, ...overrideOptions }
      : baseOptions;
    return format(bytes, mergedOptions) as FormatReturn<FormatOptions>;
  };

  return formatter as PartialFormatter<FormatOptions>;
}
