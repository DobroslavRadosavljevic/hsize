/**
 * Available unit systems for formatting byte values.
 *
 * - `"si"` - International System of Units (1000-based): kB, MB, GB, TB, etc.
 * - `"iec"` - International Electrotechnical Commission (1024-based): KiB, MiB, GiB, TiB, etc.
 * - `"jedec"` - Legacy standard (1024-based with SI names): KB, MB, GB, TB, etc.
 *
 * @example
 * format(1000, { system: "si" });    // "1 kB"
 * format(1024, { system: "iec" });   // "1 KiB"
 * format(1024, { system: "jedec" }); // "1 KB"
 */
export type UnitSystem = "si" | "iec" | "jedec";

/**
 * Type of unit: bytes or bits.
 */
export type UnitType = "bytes" | "bits";

/**
 * SI (International System of Units) byte units.
 * Uses powers of 1000: 1 kB = 1000 bytes, 1 MB = 1,000,000 bytes.
 * Note: SI uses lowercase 'k' for kilo.
 */
export type SIByteUnit =
  | "B"
  | "kB"
  | "MB"
  | "GB"
  | "TB"
  | "PB"
  | "EB"
  | "ZB"
  | "YB";

/**
 * SI (International System of Units) bit units.
 * Uses powers of 1000: 1 kb = 1000 bits, 1 Mb = 1,000,000 bits.
 */
export type SIBitUnit =
  | "b"
  | "kb"
  | "Mb"
  | "Gb"
  | "Tb"
  | "Pb"
  | "Eb"
  | "Zb"
  | "Yb";

/**
 * IEC (International Electrotechnical Commission) byte units.
 * Uses powers of 1024: 1 KiB = 1024 bytes, 1 MiB = 1,048,576 bytes.
 * The 'i' in the unit name indicates binary (e.g., "kibibyte", "mebibyte").
 */
export type IECByteUnit =
  | "B"
  | "KiB"
  | "MiB"
  | "GiB"
  | "TiB"
  | "PiB"
  | "EiB"
  | "ZiB"
  | "YiB";

/**
 * IEC (International Electrotechnical Commission) bit units.
 * Uses powers of 1024: 1 Kib = 1024 bits, 1 Mib = 1,048,576 bits.
 */
export type IECBitUnit =
  | "b"
  | "Kib"
  | "Mib"
  | "Gib"
  | "Tib"
  | "Pib"
  | "Eib"
  | "Zib"
  | "Yib";

/**
 * JEDEC (Joint Electron Device Engineering Council) byte units.
 * Uses powers of 1024 but with SI-style names: 1 KB = 1024 bytes.
 * This is the legacy standard commonly used by Windows and storage manufacturers.
 * Note: These are technically ambiguous and can cause confusion with SI units.
 */
export type JEDECByteUnit =
  | "B"
  | "KB"
  | "MB"
  | "GB"
  | "TB"
  | "PB"
  | "EB"
  | "ZB"
  | "YB";

/**
 * French octet units.
 * "Octet" is the French word for byte. Uses powers of 1000.
 */
export type FrenchOctetUnit =
  | "o"
  | "ko"
  | "Mo"
  | "Go"
  | "To"
  | "Po"
  | "Eo"
  | "Zo"
  | "Yo";

/**
 * All supported byte unit types across all unit systems.
 */
export type ByteUnit =
  | SIByteUnit
  | IECByteUnit
  | JEDECByteUnit
  | FrenchOctetUnit;

/**
 * All supported bit unit types across all unit systems.
 */
export type BitUnit = SIBitUnit | IECBitUnit;

/**
 * Union of all supported unit types (both bytes and bits).
 */
export type AllUnits = ByteUnit | BitUnit;

/**
 * Numeric byte value input type.
 * Accepts both regular numbers and bigints for large values.
 */
export type ByteValue = number | bigint;

/**
 * String representation of a byte value (e.g., "1.5 GB", "100 MiB").
 */
export type ByteString = string;

/**
 * Hybrid input type that accepts both numeric and string byte representations.
 * Used by functions that can handle either format.
 */
export type HybridByte = ByteValue | ByteString;

/**
 * Options for formatting byte values into human-readable strings.
 *
 * **Option Precedence for Unit Selection:**
 * 1. `unit` - If specified, forces the exact unit (highest priority)
 * 2. `exponent` - If specified (and no `unit`), forces the unit level
 * 3. Auto-calculated - If neither is specified, automatically selects the best unit
 *
 * @example
 * // Basic formatting
 * format(1073741824, { system: "iec" });        // "1 GiB"
 * format(1073741824, { system: "si" });         // "1.07 GB"
 * format(1073741824, { system: "jedec" });      // "1 GB"
 *
 * @example
 * // Forcing specific units (highest precedence)
 * format(1073741824, { unit: "MiB" });          // "1024 MiB"
 * format(1073741824, { exponent: 2 });          // "1024 MiB"
 *
 * @example
 * // Complex option combinations
 * format(1536, {
 *   system: "iec",
 *   decimals: 1,
 *   locale: "de-DE",
 *   signed: true
 * }); // "+1,5 KiB"
 *
 * @example
 * // Different output formats
 * format(1024, { output: "array" });            // [1, "KiB"]
 * format(1024, { output: "object" });           // { value: 1, unit: "KiB", bytes: 1024, exponent: 1 }
 */
export interface FormatOptions {
  /**
   * Unit system to use for formatting output.
   *
   * - `"si"` - International System (1000-based): kB, MB, GB
   * - `"iec"` - IEC standard (1024-based): KiB, MiB, GiB (default)
   * - `"jedec"` - Legacy standard (1024-based with SI names): KB, MB, GB
   *
   * **Note:** This controls the *output format* only. For parsing behavior,
   * see `ParseOptions.iec`.
   *
   * @default "iec"
   *
   * @example
   * format(1000, { system: "si" });    // "1 kB"
   * format(1024, { system: "iec" });   // "1 KiB"
   * format(1024, { system: "jedec" }); // "1 KB"
   */
  system?: UnitSystem;

  /**
   * Format as bits instead of bytes (multiplies by 8).
   * @default false
   *
   * @example
   * format(1024, { bits: true }); // "8 Kib"
   */
  bits?: boolean;

  /**
   * Number of decimal places in the output.
   * @default 2
   *
   * @example
   * format(1536, { decimals: 0 }); // "2 KiB"
   * format(1536, { decimals: 3 }); // "1.500 KiB"
   */
  decimals?: number;

  /**
   * Minimum fraction digits for Intl.NumberFormat.
   * Takes precedence over `decimals` when using locale formatting.
   */
  minimumFractionDigits?: number;

  /**
   * Maximum fraction digits for Intl.NumberFormat.
   * Takes precedence over `decimals` when using locale formatting.
   */
  maximumFractionDigits?: number;

  /**
   * Locale for number formatting.
   * - String: BCP 47 language tag (e.g., "de-DE", "en-US")
   * - true: Use system default locale
   * - string[]: Array of locale preferences
   *
   * @example
   * format(1536, { locale: "de-DE" }); // "1,5 KiB"
   * format(1536, { locale: "en-US" }); // "1.5 KiB"
   */
  locale?: string | boolean | string[];

  /**
   * Additional options passed to Intl.NumberFormat.
   */
  localeOptions?: Intl.NumberFormatOptions;

  /**
   * Include a space between value and unit.
   * @default true
   *
   * @example
   * format(1024, { space: false }); // "1KiB"
   */
  space?: boolean;

  /**
   * Use non-breaking space (U+00A0) between value and unit.
   * Prevents line breaks between number and unit.
   * @default false
   */
  nonBreakingSpace?: boolean;

  /**
   * Custom spacer string between value and unit.
   * Overrides `space` and `nonBreakingSpace` if provided.
   *
   * @example
   * format(1024, { spacer: "-" }); // "1-KiB"
   */
  spacer?: string;

  /**
   * Custom thousands separator for large numbers.
   *
   * @example
   * format(1000000, { thousandsSeparator: ",", exponent: 0 }); // "1,000,000 B"
   */
  thousandsSeparator?: string;

  /**
   * Include sign for positive numbers.
   * @default false
   *
   * @example
   * format(1024, { signed: true }); // "+1 KiB"
   */
  signed?: boolean;

  /**
   * Pad decimal places with trailing zeros.
   * @default false
   *
   * @example
   * format(1024, { pad: true, decimals: 2 }); // "1.00 KiB"
   */
  pad?: boolean;

  /**
   * Fixed width output, padded with leading spaces.
   *
   * @example
   * format(1024, { fixedWidth: 10 }); // "    1 KiB"
   */
  fixedWidth?: number;

  /**
   * Use long form unit names (e.g., "gibibytes" vs "GiB").
   * @default false
   *
   * @example
   * format(1073741824, { longForm: true }); // "1 gibibyte"
   * format(2147483648, { longForm: true }); // "2 gibibytes"
   */
  longForm?: boolean;

  /**
   * Custom long form names for each exponent level (0-8).
   * Used when `longForm: true`.
   *
   * @example
   * format(1024, { longForm: true, longForms: ["octets", "kilooctets", ...] });
   */
  longForms?: string[];

  /**
   * Force a specific unit for output.
   *
   * **Highest precedence** - overrides both `exponent` and auto-calculation.
   *
   * @example
   * format(1073741824, { unit: "MiB" }); // "1024 MiB"
   * format(1024, { unit: "B" });          // "1024 B"
   */
  unit?: AllUnits;

  /**
   * Force a specific exponent level (0-8).
   *
   * **Ignored if `unit` is specified.**
   *
   * Exponent levels: 0=B, 1=K, 2=M, 3=G, 4=T, 5=P, 6=E, 7=Z, 8=Y
   *
   * @example
   * format(1073741824, { exponent: 2 }); // "1024 MiB"
   * format(1024, { exponent: 0 });        // "1024 B"
   */
  exponent?: number;

  /**
   * Output format type.
   *
   * - `"string"` - Human-readable string (default): "1 GiB"
   * - `"array"` - Tuple of [value, unit]: [1, "GiB"]
   * - `"object"` - Full object with metadata: { value, unit, bytes, exponent }
   * - `"exponent"` - Just the exponent number: 3
   *
   * @default "string"
   */
  output?: "string" | "array" | "object" | "exponent";

  /**
   * Rounding method for decimal values.
   *
   * - `"round"` - Standard rounding (default)
   * - `"floor"` - Round down
   * - `"ceil"` - Round up
   * - `"trunc"` - Truncate (towards zero)
   *
   * @default "round"
   */
  roundingMethod?: "round" | "floor" | "ceil" | "trunc";

  /**
   * Custom template string for formatting output.
   *
   * Available placeholders:
   * - `{value}` - The formatted numeric value (e.g., "1.5")
   * - `{unit}` - The unit symbol (e.g., "KiB", "MB")
   * - `{longUnit}` - The long form unit name (e.g., "kibibytes", "megabytes")
   * - `{bytes}` - The original byte value
   * - `{exponent}` - The exponent level (0-8)
   *
   * @example
   * format(1536, { template: "{value}{unit}" })  // "1.5KiB"
   * format(1536, { template: "{value} {longUnit}" })  // "1.5 kibibytes"
   * format(1536, { template: "{bytes} bytes = {value} {unit}" })  // "1536 bytes = 1.5 KiB"
   * format(1536, { template: "{value}|{unit}|{exponent}" })  // "1.5|KiB|1"
   */
  template?: string;
}

/**
 * Options for parsing byte strings into numeric values.
 *
 * **Difference from FormatOptions.system:**
 * - `FormatOptions.system` controls which unit symbols to use when *formatting* output
 * - `ParseOptions.iec` controls how to *interpret* ambiguous input strings
 *
 * @example
 * // Strict mode throws on invalid input
 * parse("invalid", { strict: true }); // throws TypeError
 *
 * @example
 * // Locale-aware parsing
 * parse("1,5 GiB", { locale: "de-DE" }); // 1610612736
 *
 * @example
 * // IEC vs SI interpretation
 * parse("1 KB", { iec: true });  // 1024 (JEDEC/binary interpretation)
 * parse("1 KB", { iec: false }); // 1000 (SI/decimal interpretation)
 */
export interface ParseOptions {
  /**
   * Throw TypeError for invalid input instead of returning NaN.
   *
   * In strict mode, the following will throw:
   * - Empty strings
   * - Invalid byte string format
   * - Non-finite numbers
   *
   * @default false
   *
   * @example
   * parse("invalid");                    // NaN
   * parse("invalid", { strict: true });  // throws TypeError
   */
  strict?: boolean;

  /**
   * Locale for parsing numbers with locale-specific formatting.
   * - String: BCP 47 language tag (e.g., "de-DE" for German)
   * - true: Use system default locale
   * - string[]: Array of locale preferences
   *
   * @example
   * parse("1,5 GiB", { locale: "de-DE" }); // 1610612736
   */
  locale?: string | boolean | string[];

  /**
   * Controls how ambiguous units (like "KB", "MB") are interpreted during parsing.
   *
   * **Why `iec` instead of `system`?**
   *
   * `FormatOptions.system` specifies which unit system to use when *formatting* output
   * (choosing between SI, IEC, or JEDEC unit symbols). It's a three-way choice.
   *
   * `ParseOptions.iec` is a simpler boolean that only affects *parsing* behavior for
   * ambiguous inputs where the base (1000 vs 1024) cannot be determined from the
   * unit alone. Parsing doesn't need to choose an output format, only interpret input.
   *
   * **Behavior:**
   * - `true` (default): Ambiguous units like "KB", "MB" are treated as binary (1024-based).
   *   This matches common real-world usage where "1 GB" often means 1024^3 bytes.
   * - `false`: Ambiguous units are treated as decimal (1000-based), following strict SI.
   *
   * **Unambiguous units are always parsed correctly regardless of this setting:**
   * - IEC units ("KiB", "MiB") are always 1024-based
   * - SI units with lowercase prefix ("kB") are always 1000-based
   *
   * @default true
   *
   * @example
   * // Ambiguous "KB" unit
   * parse("1 KB", { iec: true });   // 1024 (binary)
   * parse("1 KB", { iec: false });  // 1000 (decimal)
   *
   * // Unambiguous units - iec option has no effect
   * parse("1 KiB");  // Always 1024 (IEC unit)
   * parse("1 kB");   // Always 1000 (SI unit with lowercase k)
   */
  iec?: boolean;

  /**
   * Parse as bits instead of bytes.
   * @default false
   */
  bits?: boolean;
}

/**
 * Object output format from `format()` when `output: "object"` is specified.
 *
 * Provides structured access to all components of a formatted byte value.
 *
 * @example
 * format(1073741824, { output: "object" });
 * // { value: 1, unit: "GiB", bytes: 1073741824, exponent: 3 }
 */
export interface HSizeObject {
  /** Formatted numeric value (e.g., 1.5 for "1.5 GiB") */
  value: number | string;
  /** Unit string (e.g., "GiB", "MB", "KiB") */
  unit: AllUnits;
  /** Original value in bytes */
  bytes: number;
  /** Unit exponent level (0=B, 1=K, 2=M, 3=G, 4=T, 5=P, 6=E, 7=Z, 8=Y) */
  exponent: number;
}

/**
 * Array output format from `format()` when `output: "array"` is specified.
 *
 * A tuple containing [value, unit].
 *
 * @example
 * format(1073741824, { output: "array" });
 * // [1, "GiB"]
 */
export type HSizeArray = [value: number | string, unit: AllUnits];

/**
 * Conditional return type for `format()` based on the `output` option.
 *
 * - `output: "object"` returns `HSizeObject`
 * - `output: "array"` returns `HSizeArray`
 * - `output: "exponent"` returns `number`
 * - `output: "string"` or undefined returns `string`
 */
export type FormatReturn<T extends FormatOptions> = T["output"] extends "object"
  ? HSizeObject
  : T["output"] extends "array"
    ? HSizeArray
    : T["output"] extends "exponent"
      ? number
      : string;

/**
 * Information about a byte value extracted from text by `extract()`.
 *
 * Contains both the parsed value and positional information for text manipulation.
 *
 * @example
 * extract("Downloaded 1.5 GB of data");
 * // [{
 * //   value: 1.5,
 * //   unit: "GB",
 * //   bytes: 1610612736,
 * //   input: "1.5 GB",
 * //   start: 11,
 * //   end: 17
 * // }]
 */
export interface ExtractedByte {
  /** Numeric value parsed from the string (e.g., 1.5 from "1.5 GB") */
  value: number;
  /** Unit string found (e.g., "GB", "MiB") */
  unit: string;
  /** Value converted to bytes */
  bytes: number;
  /** Original matched string including value and unit */
  input: string;
  /** Start index (inclusive) in the source text */
  start: number;
  /** End index (exclusive) in the source text */
  end: number;
}

/**
 * Configuration for creating a custom hsize instance via `create()`.
 *
 * Combines both FormatOptions and ParseOptions to set defaults for all operations.
 *
 * @example
 * const siSize = create({ system: "si", decimals: 1 });
 * siSize.format(1500);    // "1.5 kB"
 * siSize.parse("1.5 kB"); // 1500
 *
 * @example
 * // Using custom units
 * const custom = create({
 *   customUnits: {
 *     base: 1024,
 *     units: [
 *       { symbol: "ch", name: "chunk", nameP: "chunks" },
 *       { symbol: "bl", name: "block", nameP: "blocks" },
 *     ]
 *   }
 * });
 * custom.format(1048576);  // "1 bl"
 */
export interface HSizeConfig extends FormatOptions, ParseOptions {
  /**
   * Custom unit definitions to override the default unit system.
   *
   * When provided, custom units replace the standard byte units (B, KB, MB, etc.)
   * with user-defined units. Both short symbols and long names are supported.
   *
   * @example
   * {
   *   base: 1024,
   *   units: [
   *     { symbol: "ch", name: "chunk", nameP: "chunks" },
   *     { symbol: "bl", name: "block", nameP: "blocks" },
   *   ]
   * }
   */
  customUnits?: CustomUnitsConfig;
}

/**
 * Interface for chainable byte unit objects.
 *
 * Provides a fluent API for performing calculations on byte values
 * and formatting results in various unit systems.
 *
 * @example
 * unit("1 GiB")
 *   .add("500 MiB")
 *   .multiply(2)
 *   .toSI(); // "3.22 GB"
 */
export interface IHSizeUnit {
  /** Raw value in bytes */
  readonly bytes: number;

  /**
   * Add byte value(s) to the current value.
   * @param value - Value(s) to add (number, bigint, string, or array)
   * @returns New IHSizeUnit with the sum
   */
  add(value: HybridByte | HybridByte[]): IHSizeUnit;

  /**
   * Subtract byte value(s) from the current value.
   * @param value - Value(s) to subtract (number, bigint, string, or array)
   * @returns New IHSizeUnit with the difference
   */
  subtract(value: HybridByte | HybridByte[]): IHSizeUnit;

  /**
   * Multiply the current value by number(s).
   * @param value - Multiplier(s)
   * @returns New IHSizeUnit with the product
   */
  multiply(value: number | number[]): IHSizeUnit;

  /**
   * Divide the current value by number(s).
   * @param value - Divisor(s)
   * @returns New IHSizeUnit with the quotient
   */
  divide(value: number | number[]): IHSizeUnit;

  /**
   * Format to a specific unit.
   * @param unit - Target unit (e.g., "KiB", "MB")
   * @param options - Additional formatting options
   * @returns Formatted string
   */
  to(unit: AllUnits, options?: FormatOptions): string;

  /**
   * Format using SI units (1000-based: kB, MB, GB).
   * @param options - Additional formatting options
   * @returns Formatted string
   */
  toSI(options?: FormatOptions): string;

  /**
   * Format using IEC units (1024-based: KiB, MiB, GiB).
   * @param options - Additional formatting options
   * @returns Formatted string
   */
  toIEC(options?: FormatOptions): string;

  /**
   * Format using JEDEC units (1024-based with SI names: KB, MB, GB).
   * @param options - Additional formatting options
   * @returns Formatted string
   */
  toJEDEC(options?: FormatOptions): string;

  /**
   * Format as bits instead of bytes.
   * @param options - Additional formatting options
   * @returns Formatted string
   */
  toBits(options?: FormatOptions): string;

  /**
   * Get the numeric byte value (for arithmetic operations).
   * @returns The byte value as a number
   */
  valueOf(): number;

  /**
   * Format to a human-readable string.
   * @param options - Formatting options
   * @returns Formatted string
   */
  toString(options?: FormatOptions): string;

  /**
   * Convert to a JSON-serializable object.
   * @returns HSizeObject with value, unit, bytes, and exponent
   */
  toJSON(): HSizeObject;
}

/**
 * Main hsize function interface.
 *
 * The hsize function can be called directly with either:
 * - A number/bigint to format as a string
 * - A string to parse into bytes
 *
 * Also provides methods for all hsize operations.
 */
export interface HSize {
  /**
   * Format a byte value to a human-readable string.
   * @param value - The byte value to format
   * @param options - Formatting options
   * @returns Formatted string
   */
  (value: ByteValue, options?: FormatOptions): string;

  /**
   * Parse a byte string to a number of bytes.
   * @param value - The string to parse (e.g., "1.5 GB")
   * @returns The value in bytes
   */
  (value: ByteString): number;

  /**
   * Format bytes to a string with configurable output format.
   */
  format: <T extends FormatOptions>(
    bytes: ByteValue,
    options?: T
  ) => FormatReturn<T>;

  /**
   * Parse a string, number, or bigint to bytes.
   */
  parse: (
    input: ByteString | number | bigint,
    options?: ParseOptions
  ) => number;

  /**
   * Extract byte values from text.
   */
  extract: (text: string) => ExtractedByte[];

  /**
   * Create a chainable unit object.
   */
  unit: (value: HybridByte) => IHSizeUnit;

  /**
   * Create a configured hsize instance with preset options.
   */
  create: (config?: HSizeConfig) => HSize;
}

/**
 * Internal unit definition structure.
 * Used for mapping unit strings to their properties.
 */
export interface UnitDefinition {
  /** Short form symbol (e.g., "GB", "KiB") */
  short: string;
  /** Long form name (e.g., "gigabytes", "kibibytes") */
  long: string;
  /** Multiplier to convert to bytes */
  multiplier: number;
  /** Exponent level (0=B, 1=K, 2=M, 3=G, etc.) */
  exponent: number;
}

/**
 * Definition for a single custom unit.
 *
 * @example
 * { symbol: "ch", name: "chunk", nameP: "chunks" }
 */
export interface CustomUnitDefinition {
  /** Short form symbol for the unit (e.g., "ch" for chunk) */
  symbol: string;
  /** Singular long form name (e.g., "chunk") */
  name: string;
  /** Plural long form name (e.g., "chunks") */
  nameP: string;
}

/**
 * Configuration for custom unit tables.
 *
 * Allows defining custom unit systems with custom symbols and names.
 * The units array defines units in increasing order of magnitude,
 * with each unit being `base` times larger than the previous.
 *
 * @example
 * {
 *   base: 1024,
 *   units: [
 *     { symbol: "ch", name: "chunk", nameP: "chunks" },
 *     { symbol: "bl", name: "block", nameP: "blocks" },
 *     { symbol: "sc", name: "sector", nameP: "sectors" },
 *     { symbol: "rg", name: "region", nameP: "regions" },
 *   ]
 * }
 */
export interface CustomUnitsConfig {
  /** Base multiplier between units (e.g., 1024 or 1000) */
  base: number;
  /** Array of unit definitions in increasing order of magnitude */
  units: CustomUnitDefinition[];
}

/**
 * Result of parsing a unit string into its components.
 * Used internally for unit interpretation.
 */
export interface ParsedUnit {
  /** Prefix character (k, M, G, T, etc.) */
  prefix: string;
  /** Whether it's an IEC unit (contains 'i', e.g., "KiB") */
  iec: boolean;
  /** Base type: bytes (B) or bits (b) */
  type: "bytes" | "bits";
  /** Exponent level (0-8) */
  exponent: number;
}
