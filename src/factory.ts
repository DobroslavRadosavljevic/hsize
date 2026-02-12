import type {
  ByteValue,
  CustomUnitsConfig,
  ExtractedByte,
  FormatOptions,
  HSizeConfig,
  HybridByte,
  ParseOptions,
} from "./types";

import {
  decimalAbs,
  decimalCmp,
  decimalToNumber,
  getDecimalPower,
  getDecimalPowers,
  toDecimal,
} from "./decimal";
import { extract } from "./extract";
import { format } from "./format";
import { parse } from "./parse";
import { HSizeUnit } from "./unit";
import {
  bigIntToSafeNumber,
  formatNumber,
  parseLocaleNumber,
  roundToDecimals,
} from "./utils";

/**
 * Build a parse map from custom units config for efficient lookup
 */
const buildCustomParseMap = (
  customUnits: CustomUnitsConfig
): Map<string, { exponent: number }> => {
  const map = new Map<string, { exponent: number }>();

  for (const [index, unit] of customUnits.units.entries()) {
    map.set(unit.symbol.toLowerCase(), { exponent: index });
    map.set(unit.name.toLowerCase(), { exponent: index });
    map.set(unit.nameP.toLowerCase(), { exponent: index });
  }

  return map;
};

/**
 * Get the spacer string based on options
 */
const getSpacer = (options: FormatOptions): string => {
  if (options.spacer !== undefined) {
    return options.spacer;
  }
  if (options.space === false) {
    return "";
  }
  return options.nonBreakingSpace ? "\u00A0" : " ";
};

/**
 * Get the unit string for custom units
 */
const getCustomUnitString = (
  unitDef: { symbol: string; name: string; nameP: string },
  value: number,
  longForm?: boolean
): string => {
  if (!longForm) {
    return unitDef.symbol;
  }
  return decimalCmp(decimalAbs(value), 1) === 0 ? unitDef.name : unitDef.nameP;
};

/**
 * Calculate custom unit value and exponent
 */
const calculateCustomValue = (
  absBytes: ByteValue,
  customUnits: CustomUnitsConfig,
  options: FormatOptions,
  isNegative: boolean
): { value: number; exponent: number } => {
  const { base, units } = customUnits;
  const maxExponent = units.length - 1;

  const autoExponent = calculateCustomExponent(absBytes, base, maxExponent);
  let exponent = options.exponent ?? autoExponent;
  exponent = Math.max(0, Math.min(maxExponent, exponent));

  const divisor = getDecimalPower(base, exponent);
  const rawValue = decimalToNumber(toDecimal(absBytes).div(divisor));
  const value = isNegative
    ? decimalToNumber(toDecimal(rawValue).neg())
    : rawValue;

  return { exponent, value };
};

/**
 * Get absolute bytes value
 */
const getAbsBytes = (
  bytes: ByteValue,
  isBigInt: boolean,
  isNegative: boolean
): ByteValue => {
  if (!isNegative) {
    return bytes;
  }
  return isBigInt
    ? -(bytes as bigint)
    : decimalToNumber(decimalAbs(bytes as number));
};

/**
 * Format the numeric value with custom units
 */
const formatCustomValue = (
  value: number,
  isNegative: boolean,
  options: FormatOptions
): string => {
  const decimals = options.decimals ?? 2;
  const roundedValue = roundToDecimals(
    value,
    decimals,
    options.roundingMethod ?? "round"
  );

  let formatted = formatNumber(roundedValue, {
    decimals,
    locale: options.locale,
    localeOptions: options.localeOptions,
    maximumFractionDigits: options.maximumFractionDigits,
    minimumFractionDigits: options.minimumFractionDigits,
    pad: options.pad,
    thousandsSeparator: options.thousandsSeparator,
  });

  if (options.signed && !isNegative && decimalCmp(roundedValue, 0) !== 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
};

/**
 * Apply fixed width padding if needed
 */
const applyPadding = (result: string, fixedWidth?: number): string => {
  if (fixedWidth !== undefined && result.length < fixedWidth) {
    return result.padStart(fixedWidth, " ");
  }
  return result;
};

/**
 * Format bytes using custom units
 */
const formatWithCustomUnits = (
  bytes: ByteValue,
  customUnits: CustomUnitsConfig,
  options: FormatOptions
): string => {
  const isBigInt = typeof bytes === "bigint";
  const isNegative = isBigInt ? bytes < 0n : bytes < 0;
  const absBytes = getAbsBytes(bytes, isBigInt, isNegative);

  const { value, exponent } = calculateCustomValue(
    absBytes,
    customUnits,
    options,
    isNegative
  );
  const unitStr = getCustomUnitString(
    customUnits.units[exponent],
    value,
    options.longForm
  );
  const formattedValue = formatCustomValue(value, isNegative, options);
  const result = `${formattedValue}${getSpacer(options)}${unitStr}`;

  return applyPadding(result, options.fixedWidth);
};

/**
 * Custom units parse pattern
 */
const CUSTOM_PARSE_PATTERN = /^([+-]?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?)\s*(\S+)?$/i;

/**
 * Handle empty string for custom units parsing
 */
const handleEmptyInput = (strict?: boolean): number => {
  if (strict) {
    throw new TypeError("Empty string");
  }
  return Number.NaN;
};

/**
 * Handle invalid pattern match for custom units parsing
 */
const handleInvalidPattern = (input: string, strict?: boolean): number => {
  if (strict) {
    throw new TypeError(`Invalid input: ${input}`);
  }
  return Number.NaN;
};

/**
 * Handle unknown unit for custom units parsing
 */
const handleUnknownUnit = (unitStr: string, strict?: boolean): number => {
  if (strict) {
    throw new TypeError(`Unknown unit: ${unitStr}`);
  }
  return Number.NaN;
};

/**
 * Calculate byte value from parsed unit info
 */
const calculateBytesFromUnit = (
  value: number,
  unitStr: string | undefined,
  customUnits: CustomUnitsConfig,
  parseMap: Map<string, { exponent: number }>,
  strict?: boolean
): number => {
  if (!unitStr) {
    return value;
  }

  const unitInfo = parseMap.get(unitStr.toLowerCase());
  if (!unitInfo) {
    return handleUnknownUnit(unitStr, strict);
  }

  return decimalToNumber(
    toDecimal(value).mul(getDecimalPower(customUnits.base, unitInfo.exponent))
  );
};

const calculateCustomExponent = (
  absBytes: ByteValue,
  base: number,
  maxExponent: number
): number => {
  const abs = toDecimal(absBytes);
  const powers = getDecimalPowers(base, maxExponent);
  for (let exponent = maxExponent; exponent >= 1; exponent -= 1) {
    if (decimalCmp(abs, powers[exponent]) >= 0) {
      return exponent;
    }
  }
  return 0;
};

/**
 * Parse a string using custom units
 */
const parseWithCustomUnits = (
  input: string,
  customUnits: CustomUnitsConfig,
  parseMap: Map<string, { exponent: number }>,
  options: ParseOptions
): number => {
  const trimmed = input.trim();
  if (trimmed === "") {
    return handleEmptyInput(options.strict);
  }

  const match = CUSTOM_PARSE_PATTERN.exec(trimmed);
  if (!match) {
    return handleInvalidPattern(trimmed, options.strict);
  }

  const [, valueStr, unitStr] = match;
  const value = parseLocaleNumber(valueStr, options.locale);

  return calculateBytesFromUnit(
    value,
    unitStr,
    customUnits,
    parseMap,
    options.strict
  );
};

/**
 * Handle number input for parsing
 */
const handleNumberInput = (input: number, strict?: boolean): number => {
  if (!Number.isFinite(input)) {
    if (strict) {
      throw new TypeError(`Expected finite number, got ${input}`);
    }
    return Number.NaN;
  }
  return input;
};

/**
 * Handle bigint input for parsing
 */
const handleBigIntInput = (input: bigint): number => bigIntToSafeNumber(input);

/**
 * Create format function for instance
 */
const createInstanceFormat =
  (
    config: HSizeConfig,
    customUnits?: CustomUnitsConfig
  ): ((bytes: ByteValue, options?: FormatOptions) => string) =>
  (bytes: ByteValue, options?: FormatOptions): string => {
    const mergedOptions = { ...config, ...options };

    if (customUnits) {
      return formatWithCustomUnits(bytes, customUnits, mergedOptions);
    }

    return format(bytes, mergedOptions);
  };

/**
 * Create parse function for instance
 */
const createInstanceParse =
  (
    config: HSizeConfig,
    customUnits?: CustomUnitsConfig,
    customParseMap?: Map<string, { exponent: number }> | null
  ): ((input: string | number | bigint, options?: ParseOptions) => number) =>
  (input: string | number | bigint, options?: ParseOptions): number => {
    const mergedOptions = { ...config, ...options };

    if (typeof input === "number") {
      return handleNumberInput(input, mergedOptions.strict);
    }

    if (typeof input === "bigint") {
      return handleBigIntInput(input);
    }

    if (customUnits && customParseMap) {
      return parseWithCustomUnits(
        input,
        customUnits,
        customParseMap,
        mergedOptions
      );
    }

    return parse(input, mergedOptions);
  };

/**
 * Build hsize instance with methods
 */
const buildHSizeInstance = (
  instanceFormat: (bytes: ByteValue, options?: FormatOptions) => string,
  instanceParse: (
    input: string | number | bigint,
    options?: ParseOptions
  ) => number,
  config: HSizeConfig
): HSizeInstance => {
  const hsizeInstance = (
    value: HybridByte,
    options?: FormatOptions
  ): string | number => {
    if (typeof value === "string") {
      return instanceParse(value, config);
    }
    return instanceFormat(value as ByteValue, options);
  };

  hsizeInstance.format = instanceFormat;
  hsizeInstance.parse = instanceParse;
  hsizeInstance.extract = extract;
  hsizeInstance.unit = (value: HybridByte): HSizeUnit => new HSizeUnit(value);
  hsizeInstance.create = create;

  return hsizeInstance;
};

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
 *
 * @example
 * // Custom units
 * const custom = create({
 *   customUnits: {
 *     base: 1024,
 *     units: [
 *       { symbol: "ch", name: "chunk", nameP: "chunks" },
 *       { symbol: "bl", name: "block", nameP: "blocks" },
 *       { symbol: "sc", name: "sector", nameP: "sectors" },
 *       { symbol: "rg", name: "region", nameP: "regions" },
 *     ]
 *   }
 * });
 * custom.format(1048576);  // "1 bl"
 * custom.parse("2 sectors");  // 2147483648
 */
export const create = (config: HSizeConfig = {}): HSizeInstance => {
  const { customUnits } = config;
  const customParseMap = customUnits ? buildCustomParseMap(customUnits) : null;
  const instanceFormat = createInstanceFormat(config, customUnits);
  const instanceParse = createInstanceParse(
    config,
    customUnits,
    customParseMap
  );

  return buildHSizeInstance(instanceFormat, instanceParse, config);
};
