import DecimalLib from "decimal.js";

import type { FormatOptions } from "./types";

export type RoundingMethod = NonNullable<FormatOptions["roundingMethod"]>;
export type DecimalInput = DecimalLib.Value;

export const HDecimal = DecimalLib.clone({
  precision: 80,
  rounding: DecimalLib.ROUND_HALF_UP,
});

export type HDecimalValue = InstanceType<typeof HDecimal>;

export const DECIMAL_EIGHT = new HDecimal(8);
export const DECIMAL_ONE = new HDecimal(1);
export const DECIMAL_ZERO = new HDecimal(0);
export const DECIMAL_HUNDRED = new HDecimal(100);

const powerCache = new Map<number, HDecimalValue[]>([
  [1000, [new HDecimal(1)]],
  [1024, [new HDecimal(1)]],
]);

const assertPowerInput = (base: number, exponent: number): void => {
  if (!Number.isFinite(base) || base <= 0) {
    throw new TypeError(`Invalid base for decimal power: ${base}`);
  }
  if (!Number.isInteger(exponent) || exponent < 0) {
    throw new TypeError(`Invalid exponent for decimal power: ${exponent}`);
  }
};

const ensurePower = (base: number, exponent: number): HDecimalValue => {
  assertPowerInput(base, exponent);

  let powers = powerCache.get(base);
  if (!powers) {
    powers = [new HDecimal(1)];
    powerCache.set(base, powers);
  }

  for (let i = powers.length; i <= exponent; i += 1) {
    powers.push(powers[i - 1].mul(base));
  }

  return powers[exponent];
};

export const getDecimalPower = (
  base: number,
  exponent: number
): HDecimalValue => ensurePower(base, exponent);

export const getDecimalPowers = (
  base: number,
  maxExponent = 8
): readonly HDecimalValue[] => {
  ensurePower(base, maxExponent);
  return powerCache.get(base) as readonly HDecimalValue[];
};

const ROUNDING_MAP: Record<RoundingMethod, DecimalLib.Rounding> = {
  ceil: DecimalLib.ROUND_CEIL,
  floor: DecimalLib.ROUND_FLOOR,
  round: DecimalLib.ROUND_HALF_CEIL,
  trunc: DecimalLib.ROUND_DOWN,
};

export const getDecimalRounding = (
  method: RoundingMethod = "round"
): DecimalLib.Rounding => ROUNDING_MAP[method];

export const toDecimal = (value: DecimalInput): HDecimalValue =>
  value instanceof HDecimal ? value : new HDecimal(value);

export const decimalAbs = (value: DecimalInput): HDecimalValue =>
  toDecimal(value).abs();

export const decimalCmp = (a: DecimalInput, b: DecimalInput): number =>
  toDecimal(a).cmp(b);

export const decimalMax = (a: DecimalInput, b: DecimalInput): HDecimalValue =>
  decimalCmp(a, b) >= 0 ? toDecimal(a) : toDecimal(b);

export const decimalMin = (a: DecimalInput, b: DecimalInput): HDecimalValue =>
  decimalCmp(a, b) <= 0 ? toDecimal(a) : toDecimal(b);

export const decimalRound = (
  value: DecimalInput,
  decimals: number,
  method: RoundingMethod = "round"
): HDecimalValue =>
  toDecimal(value).toDecimalPlaces(decimals, getDecimalRounding(method));

export const decimalRoundInteger = (
  value: DecimalInput,
  method: RoundingMethod = "round"
): HDecimalValue => decimalRound(value, 0, method);

export const decimalToNumber = (value: DecimalInput): number =>
  toDecimal(value).toNumber();

export const decimalToString = (value: DecimalInput): string =>
  toDecimal(value).toString();
