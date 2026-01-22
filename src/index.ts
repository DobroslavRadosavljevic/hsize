import type { ByteValue, FormatOptions } from "./types";

import { average, median, sum } from "./aggregate";
import { approximate } from "./approximate";
import { clamp } from "./clamp";
import { between, eq, gt, gte, lt, lte, max, min } from "./compare";
import { BYTE_PATTERN, GLOBAL_BYTE_PATTERN } from "./constants";
import { diff } from "./diff";
import { extract } from "./extract";
import { create } from "./factory";
import { format as formatBytes } from "./format";
import { parseNatural } from "./natural";
import { parse as parseBytes } from "./parse";
import { partial } from "./partial";
import { percent, percentOf, remaining } from "./percentage";
import {
  formatCompact,
  formatFile,
  formatMemory,
  formatNetwork,
  formatPrecise,
  formatStorage,
  presets,
} from "./presets";
import { formatRange } from "./range";
import { formatRate, parseRate } from "./rate";
import { HSizeUnit, unit } from "./unit";
import { isBytes, isParsable, isUnit } from "./validators";

/**
 * SI utility functions (1000-based)
 */
export const bytes = (n: number): number => n;
export const kb = (n: number): number => n * 1e3;
export const mb = (n: number): number => n * 1e6;
export const gb = (n: number): number => n * 1e9;
export const tb = (n: number): number => n * 1e12;
export const pb = (n: number): number => n * 1e15;
export const eb = (n: number): number => n * 1e18;
export const zb = (n: number): number => n * 1e21;
export const yb = (n: number): number => n * 1e24;

/**
 * IEC utility functions (1024-based)
 */
export const kib = (n: number): number => n * 1024;
export const mib = (n: number): number => n * 1024 ** 2;
export const gib = (n: number): number => n * 1024 ** 3;
export const tib = (n: number): number => n * 1024 ** 4;
export const pib = (n: number): number => n * 1024 ** 5;
export const eib = (n: number): number => n * 1024 ** 6;
export const zib = (n: number): number => n * 1024 ** 7;
export const yib = (n: number): number => n * 1024 ** 8;

/**
 * Main polymorphic hsize function
 * Formats bytes to string or parses string to bytes
 */
function hsize(value: string): number;
function hsize(value: number | bigint, options?: FormatOptions): string;
function hsize(
  value: string | number | bigint,
  options?: FormatOptions
): string | number {
  if (typeof value === "string") {
    return parseBytes(value);
  }
  return formatBytes(value as ByteValue, options);
}

hsize.format = formatBytes;
hsize.parse = parseBytes;
hsize.extract = extract;
hsize.diff = diff;
hsize.approximate = approximate;
hsize.formatRange = formatRange;
hsize.unit = unit;
hsize.create = create;
hsize.partial = partial;
hsize.percent = percent;
hsize.percentOf = percentOf;
hsize.remaining = remaining;
hsize.sum = sum;
hsize.average = average;
hsize.median = median;
hsize.formatRate = formatRate;
hsize.parseRate = parseRate;
hsize.isBytes = isBytes;
hsize.isUnit = isUnit;
hsize.isParsable = isParsable;
hsize.gt = gt;
hsize.gte = gte;
hsize.lt = lt;
hsize.lte = lte;
hsize.eq = eq;
hsize.between = between;
hsize.min = min;
hsize.max = max;
hsize.clamp = clamp;
hsize.parseNatural = parseNatural;

export {
  formatBytes as format,
  parseBytes as parse,
  parseNatural,
  extract,
  diff,
  clamp,
  approximate,
  formatRange,
  unit,
  HSizeUnit,
  create,
  partial,
  percent,
  percentOf,
  remaining,
  sum,
  average,
  median,
  isBytes,
  isUnit,
  isParsable,
  BYTE_PATTERN,
  GLOBAL_BYTE_PATTERN,
  presets,
  formatStorage,
  formatMemory,
  formatNetwork,
  formatCompact,
  formatPrecise,
  formatFile,
  gt,
  gte,
  lt,
  lte,
  eq,
  between,
  min,
  max,
  formatRate,
  parseRate,
};

export type { AggregateOptions } from "./aggregate";
export type { ApproximateOptions, ApproximateStyle } from "./approximate";
export type { ClampOptions } from "./clamp";
export type { DiffOptions } from "./diff";
export type { RangeOptions } from "./range";
export type { HSizeInstance } from "./factory";
export type { PartialFormatter } from "./partial";
export type { PercentageOptions } from "./percentage";
export type { PresetName } from "./presets";
export type { ParsedRate, RateInterval, RateOptions } from "./rate";
export type { NaturalParseOptions } from "./natural";
export type {
  AllUnits,
  BitUnit,
  ByteString,
  ByteUnit,
  ByteValue,
  CustomUnitDefinition,
  CustomUnitsConfig,
  ExtractedByte,
  FormatOptions,
  FrenchOctetUnit,
  HSizeArray,
  HSizeConfig,
  HSizeObject,
  HybridByte,
  IECBitUnit,
  IECByteUnit,
  IHSizeUnit,
  JEDECByteUnit,
  ParseOptions,
  SIBitUnit,
  SIByteUnit,
  UnitSystem,
  UnitType,
} from "./types";

export default hsize;
