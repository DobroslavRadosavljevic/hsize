import type { ByteValue, FormatOptions } from "./types";

import { BYTE_PATTERN, GLOBAL_BYTE_PATTERN } from "./constants";
import { extract } from "./extract";
import { create } from "./factory";
import { format as formatBytes } from "./format";
import { parse as parseBytes } from "./parse";
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
hsize.unit = unit;
hsize.create = create;
hsize.isBytes = isBytes;
hsize.isUnit = isUnit;
hsize.isParsable = isParsable;

export {
  formatBytes as format,
  parseBytes as parse,
  extract,
  unit,
  HSizeUnit,
  create,
  isBytes,
  isUnit,
  isParsable,
  BYTE_PATTERN,
  GLOBAL_BYTE_PATTERN,
};

export type { HSizeInstance } from "./factory";
export type {
  AllUnits,
  BitUnit,
  ByteString,
  ByteUnit,
  ByteValue,
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
