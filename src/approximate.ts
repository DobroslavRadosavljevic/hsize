import type { ByteValue, FormatOptions, UnitSystem } from "./types";

import { DEFAULT_FORMAT_OPTIONS, UNITS } from "./constants";
import {
  DECIMAL_HUNDRED,
  DECIMAL_ONE,
  decimalAbs,
  decimalCmp,
  decimalRoundInteger,
  decimalToNumber,
  getDecimalPower,
  getDecimalPowers,
} from "./decimal";
import { format } from "./format";

/**
 * Style options for approximate formatting.
 *
 * - `"symbol"` - Uses "~", "almost", "just over" symbols (default)
 * - `"verbose"` - Uses "about", "almost", "just over" words
 */
export type ApproximateStyle = "symbol" | "verbose";

/**
 * Options for approximate byte formatting.
 */
export interface ApproximateOptions extends FormatOptions {
  /**
   * Display style for the approximation.
   *
   * - `"symbol"` - Compact style: "~1 GiB"
   * - `"verbose"` - Descriptive style: "about 1.5 GB"
   *
   * @default "symbol"
   */
  style?: ApproximateStyle;

  /**
   * Percentage threshold for "almost" and "just over" labels.
   *
   * If the value is within this percentage of a round number,
   * it will be labeled as "almost" (below) or "just over" (above).
   *
   * @default 5
   *
   * @example
   * // With threshold: 5 (5%)
   * approximate(999000000)  // "almost 1 GB" (within 5% of 1 GB)
   * approximate(1010000000) // "just over 1 GB" (within 5% above 1 GB)
   */
  threshold?: number;
}

type ApproximationType = "exact" | "almost" | "just_over" | "about";

interface ApproximationResult {
  type: ApproximationType;
  roundValue: number;
  exponent: number;
}

interface SystemConfig {
  base: number;
}

const DEFAULT_THRESHOLD = 5;
const MAX_EXPONENT = 8;
type HDecimalValue = ReturnType<typeof decimalAbs>;

const getSystemConfig = (system: UnitSystem): SystemConfig => ({
  base: system === "si" ? 1000 : 1024,
});

const getUnitForExponent = (
  system: UnitSystem,
  exponent: number,
  bits: boolean
): string => {
  const unitType = bits ? "bits" : "bytes";
  const unitArray = UNITS[system]?.[unitType] ?? UNITS.iec.bytes;
  return unitArray[exponent];
};

/**
 * Check if the value is close to the next unit level.
 */
const checkNextUnitProximity = (
  absBytes: HDecimalValue,
  exponent: number,
  threshold: number,
  base: number
): ApproximationResult | null => {
  if (exponent >= MAX_EXPONENT) {
    return null;
  }

  const nextPower = getDecimalPower(base, exponent + 1);
  const valueInNextUnit = absBytes.div(nextPower);
  const percentFromNextUnit =
    DECIMAL_ONE.minus(valueInNextUnit).mul(DECIMAL_HUNDRED);

  if (
    decimalCmp(percentFromNextUnit, 0) > 0 &&
    decimalCmp(percentFromNextUnit, threshold) <= 0
  ) {
    return { exponent: exponent + 1, roundValue: 1, type: "almost" };
  }

  return null;
};

/**
 * Determine the approximation type based on percentage difference.
 */
const determineType = (
  percentDiff: HDecimalValue,
  absPercentDiff: HDecimalValue,
  threshold: number
): ApproximationType => {
  if (decimalCmp(absPercentDiff, 0.01) < 0) {
    return "exact";
  }
  if (
    decimalCmp(percentDiff, 0) < 0 &&
    decimalCmp(absPercentDiff, threshold) <= 0
  ) {
    return "almost";
  }
  if (
    decimalCmp(percentDiff, 0) > 0 &&
    decimalCmp(absPercentDiff, threshold) <= 0
  ) {
    return "just_over";
  }
  return "about";
};

/**
 * Check if the value is near a round number at the current exponent.
 */
const checkCurrentUnitProximity = (
  absBytes: HDecimalValue,
  exponent: number,
  threshold: number,
  power: HDecimalValue,
  valueInUnit: HDecimalValue
): ApproximationResult => {
  const roundedValue = decimalRoundInteger(valueInUnit, "round");
  const exactValue = roundedValue.mul(power);

  if (decimalCmp(exactValue, 0) === 0) {
    return {
      exponent,
      roundValue: decimalToNumber(valueInUnit),
      type: "about",
    };
  }

  const percentDiff = absBytes
    .minus(exactValue)
    .div(exactValue)
    .mul(DECIMAL_HUNDRED);
  const absPercentDiff = decimalAbs(percentDiff);
  const type = determineType(percentDiff, absPercentDiff, threshold);
  const roundValue = type === "about" ? valueInUnit : roundedValue;

  return { exponent, roundValue: decimalToNumber(roundValue), type };
};

/**
 * Calculate the approximation type and round value for a byte value.
 */
const calculateApproximation = (
  bytes: number,
  system: UnitSystem,
  threshold: number
): ApproximationResult => {
  const absBytes = decimalAbs(bytes);

  if (decimalCmp(absBytes, 0) === 0) {
    return { exponent: 0, roundValue: 0, type: "exact" };
  }

  const config = getSystemConfig(system);
  const exponent = getExponent(absBytes, config.base);
  const power = getDecimalPower(config.base, exponent);
  const valueInUnit = absBytes.div(power);

  return (
    checkNextUnitProximity(absBytes, exponent, threshold, config.base) ??
    checkCurrentUnitProximity(absBytes, exponent, threshold, power, valueInUnit)
  );
};

const getExponent = (absBytes: HDecimalValue, base: number): number => {
  const powers = getDecimalPowers(base, MAX_EXPONENT);
  for (let exponent = MAX_EXPONENT; exponent >= 1; exponent -= 1) {
    if (decimalCmp(absBytes, powers[exponent]) >= 0) {
      return exponent;
    }
  }
  return 0;
};

/**
 * Get the prefix for verbose style.
 */
const getVerbosePrefix = (type: ApproximationType): string => {
  const prefixes: Record<ApproximationType, string> = {
    about: "about ",
    almost: "almost ",
    exact: "",
    just_over: "just over ",
  };
  return prefixes[type];
};

/**
 * Get the prefix for symbol style.
 */
const getSymbolPrefix = (type: ApproximationType): string => {
  const prefixes: Record<ApproximationType, string> = {
    about: "~",
    almost: "almost ",
    exact: "",
    just_over: "just over ",
  };
  return prefixes[type];
};

/**
 * Get the prefix string based on approximation type and style.
 */
const getPrefix = (type: ApproximationType, style: ApproximateStyle): string =>
  style === "verbose" ? getVerbosePrefix(type) : getSymbolPrefix(type);

/**
 * Validate the input byte value.
 */
const validateInput = (bytes: ByteValue): number => {
  const numBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;

  if (!Number.isFinite(numBytes)) {
    throw new TypeError(
      `Expected a finite number or bigint, got ${typeof bytes}: ${bytes}`
    );
  }

  return numBytes;
};

/**
 * Format the value for "almost" or "just_over" types.
 */
const formatRoundValue = (
  roundValue: number,
  exponent: number,
  isNegative: boolean,
  system: UnitSystem,
  bits: boolean,
  formatOptions: FormatOptions
): string => {
  const unit = getUnitForExponent(system, exponent, bits);
  const displayValue = isNegative ? -roundValue : roundValue;
  const spacer =
    formatOptions.spacer ?? (formatOptions.space === false ? "" : " ");
  return `${displayValue}${spacer}${unit}`;
};

/**
 * Parse options and extract relevant configuration.
 */
const parseOptions = (
  options: ApproximateOptions
): {
  style: ApproximateStyle;
  threshold: number;
  formatOptions: FormatOptions;
  system: UnitSystem;
  bits: boolean;
} => {
  const {
    style = "symbol",
    threshold = DEFAULT_THRESHOLD,
    ...formatOptions
  } = options;
  const system = formatOptions.system ?? DEFAULT_FORMAT_OPTIONS.system;
  const bits = formatOptions.bits ?? false;

  return { bits, formatOptions, style, system, threshold };
};

/**
 * Build the final formatted string.
 */
const buildFormattedString = (
  bytes: ByteValue,
  result: ApproximationResult,
  isNegative: boolean,
  config: ReturnType<typeof parseOptions>
): string => {
  const prefix = getPrefix(result.type, config.style);

  if (result.type === "almost" || result.type === "just_over") {
    const formattedValue = formatRoundValue(
      result.roundValue,
      result.exponent,
      isNegative,
      config.system,
      config.bits,
      config.formatOptions
    );
    return `${prefix}${formattedValue}`;
  }

  const decimals =
    config.formatOptions.decimals ?? (result.type === "exact" ? 0 : 1);
  const formattedValue = format(bytes, { ...config.formatOptions, decimals });

  return `${prefix}${formattedValue}`;
};

/**
 * Formats a byte value with human-friendly approximations.
 *
 * This function provides fuzzy formatting that uses natural language
 * to describe approximate values, making sizes easier to understand
 * at a glance.
 *
 * @param {ByteValue} bytes - The byte value to format. Can be a number or bigint.
 * @param {ApproximateOptions} options - Formatting options including style and threshold.
 * @returns {string} A human-readable string with approximation prefix.
 *
 * @example
 * // Basic usage with default options
 * approximate(1073741824)  // "~1 GiB"
 *
 * @example
 * // Verbose style
 * approximate(1500000000, { style: "verbose" })  // "about 1.5 GB"
 *
 * @example
 * // Values close to round numbers
 * approximate(999000000)   // "almost 1 GB"
 * approximate(1010000000)  // "just over 1 GB"
 *
 * @example
 * // Custom threshold
 * approximate(990000000, { threshold: 10 })  // "almost 1 GB" (within 10%)
 *
 * @example
 * // Combined with other format options
 * approximate(1500000000, { style: "verbose", system: "si" })
 * // "about 1.5 GB"
 */
export const approximate = (
  bytes: ByteValue,
  options: ApproximateOptions = {}
): string => {
  const config = parseOptions(options);
  const numBytes = validateInput(bytes);
  const isNegative = decimalCmp(numBytes, 0) < 0;
  const absBytes = decimalToNumber(decimalAbs(numBytes));

  const result = calculateApproximation(
    absBytes,
    config.system,
    config.threshold
  );

  return buildFormattedString(bytes, result, isNegative, config);
};
