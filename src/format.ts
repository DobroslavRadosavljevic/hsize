import type {
  AllUnits,
  ByteValue,
  FormatOptions,
  HSizeArray,
  HSizeObject,
  UnitSystem,
} from "./types";

import {
  BINARY_POWERS,
  BINARY_POWERS_BIGINT,
  DECIMAL_POWERS,
  DECIMAL_POWERS_BIGINT,
  DEFAULT_FORMAT_OPTIONS,
  LOG_1000,
  LOG_1024,
  LONG_FORMS,
  MAX_EXPONENT,
  NBSP,
  PREFIX_EXPONENTS,
  PREFIX_EXTRACTION_PATTERN,
  UNITS,
} from "./constants";
import {
  calculateExponent,
  divide,
  formatNumber,
  roundToDecimals,
} from "./utils";

type Opts = FormatOptions & {
  bits: boolean;
  decimals: number;
  output: "array" | "exponent" | "object" | "string";
  system: UnitSystem;
};

interface FormatState {
  bytes: ByteValue;
  value: number;
  exponent: number;
  unit: AllUnits;
  isBigInt: boolean;
  isNegative: boolean;
}

const validateInput = (bytes: ByteValue, isBigInt: boolean): void => {
  if (!isBigInt && !Number.isFinite(bytes)) {
    throw new TypeError(
      `Expected a finite number or bigint, got ${typeof bytes}: ${bytes}`
    );
  }
};

const getAbsBytes = (
  bytes: ByteValue,
  isNegative: boolean,
  isBigInt: boolean
): ByteValue => {
  if (!isNegative) {
    return bytes;
  }
  if (isBigInt) {
    return -(bytes as bigint);
  }
  return -(bytes as number);
};

const getBase = (system: string): number => (system === "si" ? 1000 : 1024);

const getLogBase = (system: string): number =>
  system === "si" ? LOG_1000 : LOG_1024;

const getPowersBigInt = (system: string): readonly bigint[] =>
  system === "si" ? DECIMAL_POWERS_BIGINT : BINARY_POWERS_BIGINT;

const getPowersNumber = (system: string): readonly number[] =>
  system === "si" ? DECIMAL_POWERS : BINARY_POWERS;

const clampExponent = (exp: number): number =>
  Math.max(0, Math.min(MAX_EXPONENT, exp));

/**
 * Get exponent from unit string (e.g., "KiB" -> 1, "MiB" -> 2)
 */
const getExponentFromUnit = (unit: string): number => {
  const normalizedUnit = unit.toLowerCase();

  // Match prefix letter
  const prefixMatch = PREFIX_EXTRACTION_PATTERN.exec(normalizedUnit);
  if (!prefixMatch) {
    return 0;
  }

  return PREFIX_EXPONENTS[prefixMatch[1].toLowerCase()] ?? 0;
};

const computeValue = (
  absBytes: ByteValue,
  exponent: number,
  isBigInt: boolean,
  system: string
): number => {
  const powers = isBigInt ? getPowersBigInt(system) : getPowersNumber(system);
  const divisor = powers[exponent];
  return divide(absBytes, divisor, isBigInt);
};

const adjustForBits = (
  value: number,
  exponent: number,
  base: number
): { value: number; exponent: number } => {
  let adjustedValue = value * 8;
  let adjustedExponent = exponent;

  if (adjustedValue >= base && adjustedExponent < MAX_EXPONENT) {
    adjustedValue /= base;
    adjustedExponent += 1;
  }

  return { exponent: adjustedExponent, value: adjustedValue };
};

const getUnitArray = (system: UnitSystem, bits: boolean): readonly string[] => {
  const unitType = bits ? "bits" : "bytes";
  return UNITS[system]?.[unitType] ?? UNITS.iec.bytes;
};

const getLongFormUnit = (
  system: UnitSystem,
  bits: boolean,
  exponent: number,
  customForms?: string[],
  value?: number
): string => {
  const unitType = bits ? "bits" : "bytes";
  const longFormSystem = LONG_FORMS[system]?.[unitType] ?? LONG_FORMS.iec.bytes;
  let unit = customForms?.[exponent] ?? longFormSystem[exponent];

  // Convert to lowercase for consistency
  unit = unit.toLowerCase();

  // Handle singular/plural: if value is exactly 1, use singular form
  const absValue = Math.abs(value ?? 0);
  if (absValue === 1 && unit.endsWith("s")) {
    unit = unit.slice(0, -1);
  }

  return unit;
};

const getUnit = (opts: Opts, exponent: number, value?: number): AllUnits => {
  if (opts.unit) {
    return opts.unit as AllUnits;
  }

  const system = opts.system as UnitSystem;
  const unitArray = getUnitArray(system, opts.bits ?? false);

  if (opts.longForm) {
    return getLongFormUnit(
      system,
      opts.bits ?? false,
      exponent,
      opts.longForms,
      value
    ) as AllUnits;
  }

  return unitArray[exponent] as AllUnits;
};

const getSpacer = (opts: Opts): string => {
  if (opts.spacer !== undefined) {
    return opts.spacer;
  }
  if (opts.space === false) {
    return "";
  }
  return opts.nonBreakingSpace ? NBSP : " ";
};

const formatAsString = (state: FormatState, opts: Opts): string => {
  let formattedValue = formatNumber(state.value, {
    decimals: opts.decimals,
    locale: opts.locale,
    localeOptions: opts.localeOptions,
    maximumFractionDigits: opts.maximumFractionDigits,
    minimumFractionDigits: opts.minimumFractionDigits,
    pad: opts.pad,
    thousandsSeparator: opts.thousandsSeparator,
  });

  if (opts.signed && !state.isNegative && state.value !== 0) {
    formattedValue = `+${formattedValue}`;
  }

  const spacer = getSpacer(opts);
  let result = `${formattedValue}${spacer}${state.unit}`;

  if (opts.fixedWidth !== undefined && result.length < opts.fixedWidth) {
    result = result.padStart(opts.fixedWidth, " ");
  }

  return result;
};

interface InitialState {
  absBytes: ByteValue;
  base: number;
  isBigInt: boolean;
  isNegative: boolean;
  logBase: number;
}

const getInitialState = (bytes: ByteValue, system: string): InitialState => {
  const isBigInt = typeof bytes === "bigint";
  validateInput(bytes, isBigInt);
  // Normalize negative zero to positive zero for cleaner output
  const normalizedBytes = !isBigInt && Object.is(bytes, -0) ? 0 : bytes;
  const isNegative = isBigInt
    ? normalizedBytes < 0n
    : (normalizedBytes as number) < 0;
  const absBytes = getAbsBytes(normalizedBytes, isNegative, isBigInt);
  const base = getBase(system);
  const logBase = getLogBase(system);
  return { absBytes, base, isBigInt, isNegative, logBase };
};

const getRawExponent = (init: InitialState, opts: Opts): number => {
  if (opts.unit) {
    return getExponentFromUnit(opts.unit as string);
  }
  return (
    opts.exponent ?? calculateExponent(init.absBytes, init.base, init.logBase)
  );
};

const computeExponentAndValue = (
  init: InitialState,
  opts: Opts
): { exponent: number; value: number } => {
  const system = opts.system ?? "iec";
  const rawExp = getRawExponent(init, opts);
  let exponent = clampExponent(rawExp);
  let value = computeValue(init.absBytes, exponent, init.isBigInt, system);

  if (opts.bits) {
    const adjusted = adjustForBits(value, exponent, init.base);
    ({ exponent } = adjusted);
    ({ value } = adjusted);
  }

  return { exponent, value: init.isNegative ? -value : value };
};

const buildState = (bytes: ByteValue, opts: Opts): FormatState => {
  const system = opts.system ?? "iec";
  const init = getInitialState(bytes, system);
  const { exponent, value } = computeExponentAndValue(init, opts);
  const unit = getUnit(opts, exponent, value);

  return {
    bytes,
    exponent,
    isBigInt: init.isBigInt,
    isNegative: init.isNegative,
    unit,
    value,
  };
};

const formatAsArray = (state: FormatState, opts: Opts): HSizeArray => {
  const formattedValue = roundToDecimals(
    state.value,
    opts.decimals ?? 2,
    opts.roundingMethod
  );
  return [formattedValue, state.unit] as HSizeArray;
};

const formatAsObject = (state: FormatState, opts: Opts): HSizeObject => {
  const formattedValue = roundToDecimals(
    state.value,
    opts.decimals ?? 2,
    opts.roundingMethod
  );
  const bytesNum =
    typeof state.bytes === "bigint" ? Number(state.bytes) : state.bytes;

  return {
    bytes: bytesNum,
    exponent: state.exponent,
    unit: state.unit,
    value: formattedValue,
  };
};

const formatByOutput = (
  state: FormatState,
  opts: Opts
): string | number | HSizeArray | HSizeObject => {
  if (opts.output === "exponent") {
    return state.exponent;
  }
  if (opts.output === "array") {
    return formatAsArray(state, opts);
  }
  if (opts.output === "object") {
    return formatAsObject(state, opts);
  }
  return formatAsString(state, opts);
};

const validateOptions = (opts: FormatOptions): void => {
  if (
    opts.decimals !== undefined &&
    (opts.decimals < 0 || !Number.isFinite(opts.decimals))
  ) {
    throw new TypeError("decimals must be a non-negative finite number");
  }
  if (
    opts.exponent !== undefined &&
    (!Number.isInteger(opts.exponent) || opts.exponent < 0 || opts.exponent > 8)
  ) {
    throw new TypeError("exponent must be an integer between 0 and 8");
  }
  if (opts.fixedWidth !== undefined && opts.fixedWidth < 0) {
    throw new TypeError("fixedWidth must be non-negative");
  }
};

/**
 * Formats a byte value into a human-readable string representation.
 *
 * Converts raw byte values (number or bigint) into formatted strings with appropriate
 * units (B, KB, MB, GB, etc.) based on the specified unit system and options.
 *
 * **Option Precedence:**
 * 1. `unit` - If specified, forces output to use this exact unit (highest priority)
 * 2. `exponent` - If specified (and no `unit`), forces the unit level (0=B, 1=K, 2=M, etc.)
 * 3. Auto-calculated - If neither is specified, automatically determines the best unit
 *
 * @param bytes - The byte value to format. Can be a number or bigint.
 *                Negative values and bigint are supported.
 * @param options - Formatting options to customize the output.
 * @returns Formatted string, number, array, or object depending on `output` option.
 *          Default is a formatted string like "1.5 GiB".
 *
 * @throws {TypeError} If `bytes` is not a finite number or bigint.
 * @throws {TypeError} If `decimals` is negative or not finite.
 * @throws {TypeError} If `exponent` is not between 0 and 8.
 * @throws {TypeError} If `fixedWidth` is negative.
 *
 * @example
 * // Basic usage - auto-selects appropriate unit
 * format(1024);           // "1 KiB"
 * format(1536);           // "1.5 KiB"
 * format(1073741824);     // "1 GiB"
 *
 * @example
 * // Using different unit systems
 * format(1000, { system: "si" });    // "1 kB" (1000-based)
 * format(1024, { system: "iec" });   // "1 KiB" (1024-based, default)
 * format(1024, { system: "jedec" }); // "1 KB" (1024-based, legacy naming)
 *
 * @example
 * // Forcing a specific unit (highest precedence)
 * format(1073741824, { unit: "MiB" }); // "1024 MiB"
 * format(1024, { unit: "B" });          // "1024 B"
 *
 * @example
 * // Forcing a specific exponent level
 * format(1073741824, { exponent: 2 }); // "1024 MiB" (exponent 2 = Mega)
 * format(1024, { exponent: 0 });        // "1024 B" (exponent 0 = Bytes)
 *
 * @example
 * // Controlling decimal places
 * format(1536, { decimals: 0 }); // "2 KiB"
 * format(1536, { decimals: 3 }); // "1.500 KiB"
 *
 * @example
 * // Different output formats
 * format(1024, { output: "array" });    // [1, "KiB"]
 * format(1024, { output: "object" });   // { value: 1, unit: "KiB", bytes: 1024, exponent: 1 }
 * format(1024, { output: "exponent" }); // 1
 *
 * @example
 * // Formatting as bits
 * format(1024, { bits: true }); // "8 Kib"
 *
 * @example
 * // Long form names
 * format(1073741824, { longForm: true }); // "1 gibibyte"
 * format(2147483648, { longForm: true }); // "2 gibibytes"
 *
 * @example
 * // Locale formatting
 * format(1536, { locale: "de-DE" }); // "1,5 KiB"
 *
 * @example
 * // BigInt support
 * format(BigInt(1024)); // "1 KiB"
 */
export function format(
  bytes: ByteValue,
  options: FormatOptions & { output: "object" }
): HSizeObject;
export function format(
  bytes: ByteValue,
  options: FormatOptions & { output: "array" }
): HSizeArray;
export function format(
  bytes: ByteValue,
  options: FormatOptions & { output: "exponent" }
): number;
export function format(bytes: ByteValue, options?: FormatOptions): string;
export function format(
  bytes: ByteValue,
  options: FormatOptions = {}
): string | number | HSizeArray | HSizeObject {
  validateOptions(options);
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const state = buildState(bytes, opts);
  return formatByOutput(state, opts);
}
