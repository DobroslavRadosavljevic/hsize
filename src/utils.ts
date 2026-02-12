/**
 * Utility functions for hsize
 */

import {
  INTL_CACHE_MAX_SIZE,
  THOUSANDS_SEPARATOR_PATTERN,
  TRAILING_ZEROS_PATTERN,
} from "./constants";
import {
  decimalAbs,
  decimalRound,
  decimalRoundInteger,
  decimalToNumber,
  getDecimalPowers,
  toDecimal,
} from "./decimal";

/**
 * Cache for Intl.NumberFormat instances with LRU-style eviction
 * Using a Map which maintains insertion order for LRU behavior
 */
const intlCache = new Map<string, Intl.NumberFormat>();

/**
 * Build a cache key from locale and options
 */
const buildCacheKey = (
  locale: string | string[] | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  const localeKey = Array.isArray(locale)
    ? locale.join(",")
    : (locale ?? "default");
  if (!options) {
    return localeKey;
  }
  const optionsKey = JSON.stringify(options);
  return `${localeKey}|${optionsKey}`;
};

/**
 * Evict oldest entries when cache exceeds max size
 */
const evictOldestEntries = (): void => {
  if (intlCache.size <= INTL_CACHE_MAX_SIZE) {
    return;
  }
  const entriesToRemove = intlCache.size - INTL_CACHE_MAX_SIZE;
  const keys = intlCache.keys();
  for (let i = 0; i < entriesToRemove; i += 1) {
    const { value: key } = keys.next();
    if (key) {
      intlCache.delete(key);
    }
  }
};

/**
 * Get a cached Intl.NumberFormat instance
 */
const getFormatter = (
  locale: string | string[] | undefined,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat => {
  const key = buildCacheKey(locale, options);
  const formatter = intlCache.get(key);
  if (formatter) {
    // Move to end (most recently used) by re-inserting
    intlCache.delete(key);
    intlCache.set(key, formatter);
    return formatter;
  }
  const newFormatter = new Intl.NumberFormat(locale, options);
  intlCache.set(key, newFormatter);
  evictOldestEntries();
  return newFormatter;
};

/**
 * Parse a localized number string to a number
 */
export const parseLocaleNumber = (
  str: string,
  locale?: string | boolean | string[]
): number => {
  if (typeof str !== "string") {
    return Number.NaN;
  }

  const trimmed = str.trim();

  if (!locale || locale === true) {
    return parseNormalizedNumber(trimmed.replace(",", "."));
  }

  return parseWithLocale(trimmed, locale);
};

const parseNormalizedNumber = (normalized: string): number => {
  try {
    return decimalToNumber(toDecimal(normalized));
  } catch {
    return Number.NaN;
  }
};

const parseWithLocale = (str: string, locale: string | string[]): number => {
  try {
    const formatter = getFormatter(locale);
    const parts = formatter.formatToParts(1234.5);
    const separators = extractSeparators(parts);
    return normalizeAndParse(str, separators);
  } catch {
    return parseNormalizedNumber(str.replace(",", "."));
  }
};

const extractSeparators = (
  parts: Intl.NumberFormatPart[]
): { thousand: string; decimal: string } => {
  let thousand = "";
  let decimal = ".";

  for (const part of parts) {
    if (part.type === "group") {
      thousand = part.value;
    } else if (part.type === "decimal") {
      decimal = part.value;
    }
  }

  return { decimal, thousand };
};

const normalizeAndParse = (
  str: string,
  separators: { thousand: string; decimal: string }
): number => {
  let normalized = str;

  if (separators.thousand) {
    normalized = normalized.split(separators.thousand).join("");
  }

  if (separators.decimal !== ".") {
    normalized = normalized.replace(separators.decimal, ".");
  }

  return parseNormalizedNumber(normalized);
};

/**
 * Apply rounding method to a number
 */
export const applyRounding = (
  value: number,
  method: "round" | "floor" | "ceil" | "trunc" = "round"
): number => {
  if (!Number.isFinite(value)) {
    return value;
  }
  return decimalToNumber(decimalRoundInteger(value, method));
};

/**
 * Round a number to a specific number of decimal places
 */
export const roundToDecimals = (
  value: number,
  decimals: number,
  method: "round" | "floor" | "ceil" | "trunc" = "round"
): number => {
  if (!Number.isFinite(value)) {
    return value;
  }
  return decimalToNumber(decimalRound(value, decimals, method));
};

interface FormatNumberOptions {
  decimals?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string | boolean | string[];
  localeOptions?: Intl.NumberFormatOptions;
  pad?: boolean;
  thousandsSeparator?: string;
}

/**
 * Format a number with the specified options
 */
export const formatNumber = (
  value: number,
  options: FormatNumberOptions = {}
): string => {
  const { locale } = options;

  if (locale) {
    return formatWithLocale(value, options);
  }

  return formatWithoutLocale(value, options);
};

const formatWithLocale = (
  value: number,
  options: FormatNumberOptions
): string => {
  const { decimals = 2, locale, localeOptions, pad = false } = options;
  const localeStr = locale === true ? undefined : (locale as string | string[]);
  const intlOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: options.maximumFractionDigits ?? decimals,
    minimumFractionDigits:
      options.minimumFractionDigits ?? (pad ? decimals : 0),
    ...localeOptions,
  };

  try {
    return getFormatter(localeStr, intlOptions).format(value);
  } catch {
    try {
      return toDecimal(value).toFixed(decimals);
    } catch {
      return String(value);
    }
  }
};

const formatWithoutLocale = (
  value: number,
  options: FormatNumberOptions
): string => {
  const { decimals = 2, pad = false, thousandsSeparator } = options;
  const maxDecimals = options.maximumFractionDigits ?? decimals;
  const minDecimals = options.minimumFractionDigits ?? (pad ? maxDecimals : 0);

  let result: string;
  try {
    result = toDecimal(value).toFixed(maxDecimals);
  } catch {
    result = String(value);
  }
  result = trimDecimals(result, minDecimals, maxDecimals, pad);
  result = addThousandsSeparator(result, thousandsSeparator);

  return result;
};

const padToMinDecimals = (trimmed: string, minDecimals: number): string => {
  const parts = trimmed.split(".");
  const currentDecimals = parts[1]?.length ?? 0;

  if (currentDecimals >= minDecimals) {
    return trimmed;
  }

  const decimal = (parts[1] ?? "").padEnd(minDecimals, "0");
  return `${parts[0]}.${decimal}`;
};

const trimDecimals = (
  result: string,
  minDecimals: number,
  maxDecimals: number,
  pad: boolean
): string => {
  if (pad || minDecimals >= maxDecimals) {
    return result;
  }

  const trimmed = result.replace(TRAILING_ZEROS_PATTERN, "");

  return minDecimals === 0 ? trimmed : padToMinDecimals(trimmed, minDecimals);
};

const addThousandsSeparator = (result: string, separator?: string): string => {
  if (!separator) {
    return result;
  }

  const parts = result.split(".");
  parts[0] = parts[0].replaceAll(THOUSANDS_SEPARATOR_PATTERN, separator);
  return parts.join(".");
};

/**
 * Calculate the exponent (unit level) for a byte value
 */
export const calculateExponent = (
  bytes: number | bigint,
  base: number,
  _logBase: number
): number => {
  if (bytes === 0 || bytes === 0n) {
    return 0;
  }

  const absBytes = decimalAbs(bytes);
  const powers = getDecimalPowers(base);
  for (let exponent = 8; exponent >= 1; exponent -= 1) {
    if (absBytes.gte(powers[exponent])) {
      return exponent;
    }
  }
  return 0;
};

/**
 * Divide a value by a divisor, handling both number and bigint
 */
export const divide = (
  value: number | bigint,
  divisor: number | bigint,
  isBigInt: boolean
): number => {
  if (divisor === 0 || divisor === 0n) {
    return Number.NaN;
  }

  if (!isBigInt) {
    return decimalToNumber(toDecimal(value as number).div(divisor as number));
  }

  const left =
    typeof value === "bigint"
      ? toDecimal(value)
      : decimalRoundInteger(value, "floor");
  const right =
    typeof divisor === "bigint"
      ? toDecimal(divisor)
      : decimalRoundInteger(divisor, "floor");

  return decimalToNumber(left.div(right));
};

/**
 * Check if a value is a valid byte value (number or bigint)
 */
export const isValidByteValue = (value: unknown): value is number | bigint => {
  if (typeof value === "bigint") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return false;
};

interface ResolveOptions {
  strict?: boolean;
}

const BIGINT_RANGE_ERROR_MESSAGE =
  "hsize: BigInt value exceeds safe integer range, precision would be lost";
const BIGINT_RANGE_WARN_MESSAGE =
  "hsize: BigInt value exceeds safe integer range, precision may be lost";

const isBigIntOutOfSafeRange = (value: bigint): boolean =>
  value > BigInt(Number.MAX_SAFE_INTEGER) ||
  value < BigInt(Number.MIN_SAFE_INTEGER);

export const bigIntToSafeNumber = (value: bigint): number => {
  if (isBigIntOutOfSafeRange(value)) {
    throw new RangeError(BIGINT_RANGE_ERROR_MESSAGE);
  }
  return Number(value);
};

const bigIntToNumber = (
  value: bigint,
  options: ResolveOptions = {}
): number => {
  if (isBigIntOutOfSafeRange(value)) {
    if (options.strict) {
      throw new RangeError(BIGINT_RANGE_ERROR_MESSAGE);
    }
    console.warn(BIGINT_RANGE_WARN_MESSAGE);
  }
  return Number(value);
};

/**
 * Resolve a hybrid byte value (number, bigint, or string) to bytes
 */
export const resolveToBytes = (
  value: number | bigint | string,
  parse: (str: string) => number,
  options: ResolveOptions = {}
): number => {
  if (typeof value === "string") {
    return parse(value);
  }

  if (typeof value === "bigint") {
    return bigIntToNumber(value, options);
  }

  return value;
};
