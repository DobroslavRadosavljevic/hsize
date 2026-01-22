import type {
  ByteValue,
  ExtractedByte,
  FormatOptions,
  HSizeConfig,
  HybridByte,
  ParseOptions,
} from "./types";

import { extract } from "./extract";
import { format } from "./format";
import { parse } from "./parse";
import { HSizeUnit } from "./unit";

/**
 * A configured hsize instance with pre-set default options.
 *
 * The instance is callable directly for convenience:
 * - Pass a string to parse it to bytes
 * - Pass a number/bigint to format it to a string
 *
 * Also exposes all hsize functions as methods that inherit the configured defaults.
 */
export interface HSizeInstance {
  /**
   * Parses a byte string to a number of bytes, or formats a byte value to a string.
   * - Pass a string to parse it to bytes (returns number)
   * - Pass a number/bigint to format it (returns string)
   * @param value - A string to parse, or a number/bigint to format
   * @param options - Format options (only used when value is number/bigint)
   * @returns Parsed bytes (number) or formatted string
   */
  (value: HybridByte, options?: FormatOptions): string | number;

  /**
   * Creates a new hsize instance with different configuration.
   * @param config - Configuration options for the new instance
   * @returns A new HSizeInstance
   */
  create: (config?: HSizeConfig) => HSizeInstance;

  /**
   * Extracts byte values from text.
   * @param text - The text to scan for byte sizes
   * @returns Array of extracted byte information
   */
  extract: (text: string) => ExtractedByte[];

  /**
   * Formats bytes to a human-readable string.
   * Options are merged with the instance's default configuration.
   * Note: Factory instances always return strings. For other output formats,
   * use the standalone `format` function directly.
   * @param bytes - The byte value to format
   * @param options - Formatting options
   * @returns Formatted string
   */
  format: (bytes: ByteValue, options?: FormatOptions) => string;

  /**
   * Parses a string, number, or bigint to bytes.
   * Options are merged with the instance's default configuration.
   * @param input - The value to parse
   * @param options - Parsing options
   * @returns The value in bytes
   */
  parse: (input: string | number | bigint, options?: ParseOptions) => number;

  /**
   * Creates a chainable HSizeUnit object.
   * @param value - Initial byte value (number, bigint, or string)
   * @returns A chainable HSizeUnit instance
   */
  unit: (value: HybridByte) => HSizeUnit;
}

/**
 * Creates a configured hsize instance with preset default options.
 *
 * Use this to create instances with pre-configured settings that will be
 * applied to all subsequent operations. This is useful when you consistently
 * need specific formatting or parsing behavior throughout your application.
 *
 * The instance can be called directly as a function:
 * - Pass a string to parse it to bytes
 * - Pass a number/bigint to format it as a string
 *
 * All methods on the returned instance will merge their options with the
 * configured defaults, with per-call options taking precedence.
 *
 * @param {HSizeConfig} [config] - Default options for the instance. Combines both FormatOptions
 *                 and ParseOptions. These become the defaults for all operations.
 * @returns {HSizeInstance} A configured HSizeInstance with all hsize functions available as methods.
 *
 * @example
 * // Create an SI-based instance
 * const siSize = create({ system: "si" });
 * siSize(1000);           // "1 kB"
 * siSize.format(1000000); // "1 MB"
 *
 * @example
 * // Create a JEDEC instance with specific decimal places
 * const jedec = create({ system: "jedec", decimals: 1 });
 * jedec(1536);            // "1.5 KB"
 * jedec.format(1073741824); // "1.0 GB"
 *
 * @example
 * // Create a strict parsing instance
 * const strict = create({ strict: true });
 * strict.parse("1 GB");    // 1073741824
 * strict.parse("invalid"); // throws TypeError
 *
 * @example
 * // Override defaults per-call
 * const instance = create({ decimals: 2 });
 * instance.format(1536, { decimals: 0 }); // "2 KiB" (per-call option wins)
 *
 * @example
 * // Using the direct callable syntax
 * const hsize = create();
 * hsize("1 GB");         // 1073741824 (parses string)
 * hsize(1073741824);     // "1 GiB" (formats number)
 *
 * @example
 * // Locale-aware instance
 * const german = create({ locale: "de-DE" });
 * german.format(1536);    // "1,5 KiB"
 * german.parse("1,5 GiB"); // 1610612736
 *
 * @example
 * // Instance with bits output
 * const bits = create({ bits: true });
 * bits(1024);             // "8 Kib"
 */
export const create = (config: HSizeConfig = {}): HSizeInstance => {
  const hsizeInstance = (
    value: HybridByte,
    options?: FormatOptions
  ): string | number => {
    if (typeof value === "string") {
      return parse(value, config);
    }
    return format(value as ByteValue, { ...config, ...options });
  };

  hsizeInstance.format = (bytes: ByteValue, options?: FormatOptions): string =>
    format(bytes, { ...config, ...options });

  hsizeInstance.parse = (
    input: string | number | bigint,
    options?: ParseOptions
  ): number => parse(input, { ...config, ...options });

  hsizeInstance.extract = extract;

  hsizeInstance.unit = (value: HybridByte): HSizeUnit => new HSizeUnit(value);

  hsizeInstance.create = create;

  return hsizeInstance;
};
