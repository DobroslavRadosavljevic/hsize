/**
 * Natural language parsing for informal byte descriptions.
 *
 * Parses colloquial expressions like "about 2 gigs", "half a terabyte",
 * or "a couple hundred megs" into byte values.
 *
 * @module natural
 */
import {
  decimalRoundInteger,
  decimalToNumber,
  getDecimalPower,
  toDecimal,
} from "./decimal";

/**
 * Options for natural language parsing.
 */
export interface NaturalParseOptions {
  /**
   * Throw TypeError for invalid input instead of returning NaN.
   * @default false
   */
  strict?: boolean;
}

/**
 * IEC unit multipliers (1024-based).
 * Used as the default interpretation for ambiguous informal units.
 */
const IEC_MULTIPLIERS: Record<string, number> = {
  byte: 1,
  bytes: 1,
  gig: decimalToNumber(getDecimalPower(1024, 3)),
  gigs: decimalToNumber(getDecimalPower(1024, 3)),
  kilo: decimalToNumber(getDecimalPower(1024, 1)),
  kilos: decimalToNumber(getDecimalPower(1024, 1)),
  meg: decimalToNumber(getDecimalPower(1024, 2)),
  megs: decimalToNumber(getDecimalPower(1024, 2)),
  peta: decimalToNumber(getDecimalPower(1024, 5)),
  petas: decimalToNumber(getDecimalPower(1024, 5)),
  tera: decimalToNumber(getDecimalPower(1024, 4)),
  teras: decimalToNumber(getDecimalPower(1024, 4)),
};

/**
 * Fraction words mapped to their decimal values.
 */
const FRACTIONS: Record<string, number> = {
  half: decimalToNumber(toDecimal(1).div(2)),
  quarter: decimalToNumber(toDecimal(1).div(4)),
  third: decimalToNumber(toDecimal(1).div(3)),
};

/**
 * Quantity words mapped to their numeric values.
 * Note: "a" and "an" are handled separately as they can be
 * standalone (meaning 1) or part of compound expressions like "a couple".
 */
const QUANTITIES: Record<string, number> = {
  couple: 2,
  dozen: 12,
  eight: 8,
  few: 3,
  five: 5,
  four: 4,
  nine: 9,
  one: 1,
  seven: 7,
  several: 5,
  six: 6,
  ten: 10,
  three: 3,
  two: 2,
};

/**
 * Standalone article words that mean 1 when not followed by compound quantities.
 */
const ARTICLES = new Set(["a", "an"]);

/**
 * Multiplier words mapped to their numeric values.
 */
const MULTIPLIERS: Record<string, number> = {
  hundred: 100,
  million: 1_000_000,
  thousand: 1000,
};

/**
 * Approximation words that can be ignored during parsing.
 */
const APPROXIMATION_WORDS = new Set([
  "about",
  "around",
  "roughly",
  "approximately",
  "nearly",
  "almost",
  "like",
  "maybe",
  "probably",
  "or",
  "so",
]);

/**
 * Unit aliases that normalize to standard informal unit names.
 */
const UNIT_ALIASES: Record<string, string> = {
  b: "byte",
  byte: "byte",
  bytes: "bytes",
  g: "gig",
  gb: "gig",
  gig: "gig",
  gigabyte: "gig",
  gigabytes: "gigs",
  gigs: "gigs",
  k: "kilo",
  kb: "kilo",
  kilo: "kilo",
  kilobyte: "kilo",
  kilobytes: "kilos",
  kilos: "kilos",
  m: "meg",
  mb: "meg",
  meg: "meg",
  megabyte: "meg",
  megabytes: "megs",
  megs: "megs",
  p: "peta",
  pb: "peta",
  peta: "peta",
  petabyte: "peta",
  petabytes: "petas",
  petas: "petas",
  t: "tera",
  tb: "tera",
  tera: "tera",
  terabyte: "tera",
  terabytes: "teras",
  teras: "teras",
};

/**
 * Tokenizes the input text into normalized words.
 */
const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replaceAll(/[^\s\w.]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);

/**
 * Checks if a string represents a numeric value.
 */
const isNumeric = (str: string): boolean => /^-?\d+(?:\.\d+)?$/.test(str);

/**
 * Finds the unit multiplier from tokens.
 * Returns the multiplier and the index where the unit was found.
 */
const findUnit = (
  tokens: string[]
): { multiplier: number; index: number } | undefined => {
  for (const [index, token] of tokens.entries()) {
    const normalizedUnit = UNIT_ALIASES[token];
    if (normalizedUnit && IEC_MULTIPLIERS[normalizedUnit]) {
      return { index, multiplier: IEC_MULTIPLIERS[normalizedUnit] };
    }
  }
  return undefined;
};

/**
 * Filters tokens to remove approximation words.
 */
const getRelevantTokens = (tokens: string[], unitIndex: number): string[] =>
  tokens.slice(0, unitIndex).filter((t) => !APPROXIMATION_WORDS.has(t));

/**
 * Finds a fraction word in the tokens.
 */
const findFraction = (tokens: string[]): number | undefined => {
  for (const token of tokens) {
    if (FRACTIONS[token] !== undefined) {
      return FRACTIONS[token];
    }
  }
  return undefined;
};

/**
 * Finds an explicit number in the tokens (searching from end).
 */
const findExplicitNumber = (tokens: string[]): number | undefined => {
  for (const token of tokens.toReversed()) {
    if (isNumeric(token)) {
      return decimalToNumber(toDecimal(token));
    }
  }
  return undefined;
};

/**
 * Extracts quantity, multiplier, and article from tokens.
 */
const extractQuantityInfo = (
  tokens: string[]
): {
  quantity: number | undefined;
  multiplier: number;
  hasArticle: boolean;
} => {
  let quantity: number | undefined;
  let multiplier = 1;
  let hasArticle = false;

  for (const token of tokens) {
    if (ARTICLES.has(token)) {
      hasArticle = true;
    } else if (QUANTITIES[token] !== undefined && quantity === undefined) {
      quantity = QUANTITIES[token];
    } else if (MULTIPLIERS[token] !== undefined) {
      multiplier = MULTIPLIERS[token];
    }
  }

  return { hasArticle, multiplier, quantity };
};

/**
 * Computes value from quantity info (quantity words and articles).
 */
const computeQuantityValue = (
  info: ReturnType<typeof extractQuantityInfo>
): number | undefined => {
  const { quantity, multiplier, hasArticle } = info;
  if (quantity !== undefined) {
    return decimalToNumber(toDecimal(quantity).mul(multiplier));
  }
  // If we only have an article ("a gig", "an meg"), it means 1
  return hasArticle ? multiplier : undefined;
};

/**
 * Extracts a numeric value from the tokens.
 * Handles explicit numbers, fractions, quantities, and multipliers.
 */
const extractValue = (
  tokens: string[],
  unitIndex: number
): number | undefined => {
  const relevantTokens = getRelevantTokens(tokens, unitIndex);

  if (relevantTokens.length === 0) {
    return undefined;
  }

  // Try each extraction method in order of precedence
  return (
    findFraction(relevantTokens) ??
    findExplicitNumber(relevantTokens) ??
    computeQuantityValue(extractQuantityInfo(relevantTokens))
  );
};

/**
 * Processes tokens and returns the calculated byte value.
 */
const processTokens = (
  tokens: string[],
  text: string,
  strict: boolean | undefined
): number => {
  const unitResult = findUnit(tokens);
  if (!unitResult) {
    return handleInvalid(strict, `No recognizable unit found in: ${text}`);
  }

  const value = extractValue(tokens, unitResult.index);
  if (value === undefined) {
    return handleInvalid(strict, `No recognizable quantity found in: ${text}`);
  }

  return decimalToNumber(
    decimalRoundInteger(toDecimal(value).mul(unitResult.multiplier), "round")
  );
};

/**
 * Parses informal byte descriptions into byte values.
 *
 * Supports various natural language patterns:
 * - Informal unit names: "gig/gigs", "meg/megs", "tera/teras", "kilo/kilos"
 * - Approximation words: "about", "around", "roughly", "approximately"
 * - Fractions: "half", "quarter", "third"
 * - Quantities: "a couple", "a few", "several"
 * - Multipliers: "hundred", "thousand"
 *
 * Returns the best estimate in bytes. For ambiguous inputs, prefers IEC (1024-based) interpretation.
 *
 * @example
 * // Basic usage
 * parseNatural("about 2 gigs");       // 2147483648
 * parseNatural("around 500 megs");    // 524288000
 *
 * @example
 * // Fractions
 * parseNatural("half a terabyte");    // 549755813888
 * parseNatural("quarter of a gig");   // 268435456
 *
 * @example
 * // Quantities
 * parseNatural("a couple gigs");      // 2147483648
 * parseNatural("few hundred megs");   // 314572800
 *
 * @example
 * // Strict mode
 * parseNatural("invalid text", { strict: true }); // throws TypeError
 */
export const parseNatural = (
  text: string,
  options: NaturalParseOptions = {}
): number => {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return handleInvalid(options.strict, "Empty input");
  }

  return processTokens(tokens, text, options.strict);
};

/**
 * Handles invalid input based on strict mode.
 */
const handleInvalid = (
  strict: boolean | undefined,
  message: string
): number => {
  if (strict) {
    throw new TypeError(message);
  }
  return Number.NaN;
};
