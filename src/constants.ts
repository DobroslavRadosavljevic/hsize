/**
 * Pre-computed binary powers (1024^n) for O(1) lookup
 * Values: 1, 1024, 1048576, 1073741824, ...
 */
export const BINARY_POWERS = [
  1,
  1024,
  1_048_576,
  1_073_741_824,
  2 ** 40,
  2 ** 50,
  2 ** 60,
  2 ** 70,
  2 ** 80,
] as const;

/**
 * Pre-computed decimal powers (1000^n) for O(1) lookup
 */
export const DECIMAL_POWERS = [
  1, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24,
] as const;

/**
 * Pre-computed BigInt binary powers for large number support
 */
export const BINARY_POWERS_BIGINT = [
  1n,
  1024n,
  1_048_576n,
  1_073_741_824n,
  1_099_511_627_776n,
  1_125_899_906_842_624n,
  1_152_921_504_606_846_976n,
  1_180_591_620_717_411_303_424n,
  1_208_925_819_614_629_174_706_176n,
] as const;

/**
 * Pre-computed BigInt decimal powers for large number support
 */
export const DECIMAL_POWERS_BIGINT = [
  1n,
  1000n,
  1_000_000n,
  1_000_000_000n,
  1_000_000_000_000n,
  1_000_000_000_000_000n,
  1_000_000_000_000_000_000n,
  1_000_000_000_000_000_000_000n,
  1_000_000_000_000_000_000_000_000n,
] as const;

/**
 * Pre-computed logarithms for fast exponent calculation
 */
export const LOG_1024 = Math.log(1024);
export const LOG_1000 = Math.log(1000);

/**
 * Unit symbols for each system
 */
export const UNITS = {
  french: {
    bytes: ["o", "ko", "Mo", "Go", "To", "Po", "Eo", "Zo", "Yo"],
  },
  iec: {
    bits: ["b", "Kib", "Mib", "Gib", "Tib", "Pib", "Eib", "Zib", "Yib"],
    bytes: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
  },
  jedec: {
    bits: ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"],
    bytes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
  },
  si: {
    bits: ["b", "kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"],
    bytes: ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
  },
} as const;

/**
 * Long form names for units
 */
export const LONG_FORMS = {
  french: {
    bytes: [
      "Octets",
      "Kilooctets",
      "Megaoctets",
      "Gigaoctets",
      "Teraoctets",
      "Petaoctets",
      "Exaoctets",
      "Zettaoctets",
      "Yottaoctets",
    ],
  },
  iec: {
    bits: [
      "Bits",
      "Kibibits",
      "Mebibits",
      "Gibibits",
      "Tebibits",
      "Pebibits",
      "Exbibits",
      "Zebibits",
      "Yobibits",
    ],
    bytes: [
      "Bytes",
      "Kibibytes",
      "Mebibytes",
      "Gibibytes",
      "Tebibytes",
      "Pebibytes",
      "Exbibytes",
      "Zebibytes",
      "Yobibytes",
    ],
  },
  jedec: {
    bits: [
      "Bits",
      "Kilobits",
      "Megabits",
      "Gigabits",
      "Terabits",
      "Petabits",
      "Exabits",
      "Zettabits",
      "Yottabits",
    ],
    bytes: [
      "Bytes",
      "Kilobytes",
      "Megabytes",
      "Gigabytes",
      "Terabytes",
      "Petabytes",
      "Exabytes",
      "Zettabytes",
      "Yottabytes",
    ],
  },
  si: {
    bits: [
      "Bits",
      "Kilobits",
      "Megabits",
      "Gigabits",
      "Terabits",
      "Petabits",
      "Exabits",
      "Zettabits",
      "Yottabits",
    ],
    bytes: [
      "Bytes",
      "Kilobytes",
      "Megabytes",
      "Gigabytes",
      "Terabytes",
      "Petabytes",
      "Exabytes",
      "Zettabytes",
      "Yottabytes",
    ],
  },
} as const;

/**
 * Regex pattern for parsing byte strings
 * Matches: "1.5 GB", "1,5 Mo", "100KiB", "-50 bytes", etc.
 */
export const BYTE_PATTERN =
  /^([+-]?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?)\s*((?:([kmgtpezy])(i?))?(b(?:ytes?|its?)?|o(?:ctets?)?))?$/i;

/**
 * Global version for extracting multiple matches from text
 */
export const GLOBAL_BYTE_PATTERN =
  /([+-]?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?)\s*((?:([kmgtpezy])(i?))?(b(?:ytes?|its?)?|o(?:ctets?)?))/gi;

/**
 * Prefix to exponent mapping
 */
export const PREFIX_EXPONENTS = Object.freeze<Record<string, number>>({
  "": 0,
  e: 6,
  g: 3,
  k: 1,
  m: 2,
  p: 5,
  t: 4,
  y: 8,
  z: 7,
});

/**
 * Unit to base mapping for parsing
 * Maps lowercase unit strings to their configuration
 */
export const UNIT_MAP = Object.freeze<
  Record<string, { base: number; bits: boolean; exponent: number }>
>({
  b: { base: 1, bits: false, exponent: 0 },
  bit: { base: 1, bits: true, exponent: 0 },
  bits: { base: 1, bits: true, exponent: 0 },
  byte: { base: 1, bits: false, exponent: 0 },
  bytes: { base: 1, bits: false, exponent: 0 },
  eb: { base: 1000, bits: false, exponent: 6 },
  eib: { base: 1024, bits: false, exponent: 6 },
  eo: { base: 1000, bits: false, exponent: 6 },
  exabit: { base: 1000, bits: true, exponent: 6 },
  exabits: { base: 1000, bits: true, exponent: 6 },
  exabyte: { base: 1000, bits: false, exponent: 6 },
  exabytes: { base: 1000, bits: false, exponent: 6 },
  exbibit: { base: 1024, bits: true, exponent: 6 },
  exbibits: { base: 1024, bits: true, exponent: 6 },
  exbibyte: { base: 1024, bits: false, exponent: 6 },
  exbibytes: { base: 1024, bits: false, exponent: 6 },
  gb: { base: 1000, bits: false, exponent: 3 },
  gib: { base: 1024, bits: false, exponent: 3 },
  gibibit: { base: 1024, bits: true, exponent: 3 },
  gibibits: { base: 1024, bits: true, exponent: 3 },
  gibibyte: { base: 1024, bits: false, exponent: 3 },
  gibibytes: { base: 1024, bits: false, exponent: 3 },
  gigabit: { base: 1000, bits: true, exponent: 3 },
  gigabits: { base: 1000, bits: true, exponent: 3 },
  gigabyte: { base: 1000, bits: false, exponent: 3 },
  gigabytes: { base: 1000, bits: false, exponent: 3 },
  go: { base: 1000, bits: false, exponent: 3 },
  kb: { base: 1000, bits: false, exponent: 1 },
  kib: { base: 1024, bits: false, exponent: 1 },
  kibibit: { base: 1024, bits: true, exponent: 1 },
  kibibits: { base: 1024, bits: true, exponent: 1 },
  kibibyte: { base: 1024, bits: false, exponent: 1 },
  kibibytes: { base: 1024, bits: false, exponent: 1 },
  kilobit: { base: 1000, bits: true, exponent: 1 },
  kilobits: { base: 1000, bits: true, exponent: 1 },
  kilobyte: { base: 1000, bits: false, exponent: 1 },
  kilobytes: { base: 1000, bits: false, exponent: 1 },
  ko: { base: 1000, bits: false, exponent: 1 },
  mb: { base: 1000, bits: false, exponent: 2 },
  mebibit: { base: 1024, bits: true, exponent: 2 },
  mebibits: { base: 1024, bits: true, exponent: 2 },
  mebibyte: { base: 1024, bits: false, exponent: 2 },
  mebibytes: { base: 1024, bits: false, exponent: 2 },
  megabit: { base: 1000, bits: true, exponent: 2 },
  megabits: { base: 1000, bits: true, exponent: 2 },
  megabyte: { base: 1000, bits: false, exponent: 2 },
  megabytes: { base: 1000, bits: false, exponent: 2 },
  mib: { base: 1024, bits: false, exponent: 2 },
  mo: { base: 1000, bits: false, exponent: 2 },
  o: { base: 1, bits: false, exponent: 0 },
  octet: { base: 1, bits: false, exponent: 0 },
  octets: { base: 1, bits: false, exponent: 0 },
  pb: { base: 1000, bits: false, exponent: 5 },
  pebibit: { base: 1024, bits: true, exponent: 5 },
  pebibits: { base: 1024, bits: true, exponent: 5 },
  pebibyte: { base: 1024, bits: false, exponent: 5 },
  pebibytes: { base: 1024, bits: false, exponent: 5 },
  petabit: { base: 1000, bits: true, exponent: 5 },
  petabits: { base: 1000, bits: true, exponent: 5 },
  petabyte: { base: 1000, bits: false, exponent: 5 },
  petabytes: { base: 1000, bits: false, exponent: 5 },
  pib: { base: 1024, bits: false, exponent: 5 },
  po: { base: 1000, bits: false, exponent: 5 },
  tb: { base: 1000, bits: false, exponent: 4 },
  tebibit: { base: 1024, bits: true, exponent: 4 },
  tebibits: { base: 1024, bits: true, exponent: 4 },
  tebibyte: { base: 1024, bits: false, exponent: 4 },
  tebibytes: { base: 1024, bits: false, exponent: 4 },
  terabit: { base: 1000, bits: true, exponent: 4 },
  terabits: { base: 1000, bits: true, exponent: 4 },
  terabyte: { base: 1000, bits: false, exponent: 4 },
  terabytes: { base: 1000, bits: false, exponent: 4 },
  tib: { base: 1024, bits: false, exponent: 4 },
  to: { base: 1000, bits: false, exponent: 4 },
  yb: { base: 1000, bits: false, exponent: 8 },
  yib: { base: 1024, bits: false, exponent: 8 },
  yo: { base: 1000, bits: false, exponent: 8 },
  yobibit: { base: 1024, bits: true, exponent: 8 },
  yobibits: { base: 1024, bits: true, exponent: 8 },
  yobibyte: { base: 1024, bits: false, exponent: 8 },
  yobibytes: { base: 1024, bits: false, exponent: 8 },
  yottabit: { base: 1000, bits: true, exponent: 8 },
  yottabits: { base: 1000, bits: true, exponent: 8 },
  yottabyte: { base: 1000, bits: false, exponent: 8 },
  yottabytes: { base: 1000, bits: false, exponent: 8 },
  zb: { base: 1000, bits: false, exponent: 7 },
  zebibit: { base: 1024, bits: true, exponent: 7 },
  zebibits: { base: 1024, bits: true, exponent: 7 },
  zebibyte: { base: 1024, bits: false, exponent: 7 },
  zebibytes: { base: 1024, bits: false, exponent: 7 },
  zettabit: { base: 1000, bits: true, exponent: 7 },
  zettabits: { base: 1000, bits: true, exponent: 7 },
  zettabyte: { base: 1000, bits: false, exponent: 7 },
  zettabytes: { base: 1000, bits: false, exponent: 7 },
  zib: { base: 1024, bits: false, exponent: 7 },
  zo: { base: 1000, bits: false, exponent: 7 },
});

/**
 * Default format options
 */
export const DEFAULT_FORMAT_OPTIONS = {
  bits: false,
  decimals: 2,
  longForm: false,
  nonBreakingSpace: false,
  output: "string" as const,
  pad: false,
  roundingMethod: "round" as const,
  signed: false,
  space: true,
  system: "iec" as const,
} as const;

/**
 * Default parse options
 */
export const DEFAULT_PARSE_OPTIONS = {
  bits: false,
  iec: true,
  strict: false,
} as const;

/**
 * Maximum exponent level (Yottabyte = 10^24)
 */
export const MAX_EXPONENT = 8;

/**
 * Non-breaking space character
 */
export const NBSP = "\u00A0";

// ============================================================================
// Regex Patterns (hoisted to module scope for performance)
// ============================================================================

/**
 * Pattern to validate unit strings (e.g., "KiB", "MB", "bytes")
 */
export const UNIT_VALIDATION_PATTERN = /^[kmgtpezy]?i?b(?:ytes?|its?)?$/i;

/**
 * Pattern to extract prefix letter from unit string (e.g., "k" from "KiB")
 */
export const PREFIX_EXTRACTION_PATTERN = /^([kmgtpezy])/i;

/**
 * Pattern to check for JEDEC style units (e.g., "KB", "MB")
 */
export const JEDEC_STYLE_PATTERN = /^[KMGTPEZY]B$/;

/**
 * Pattern to check for uppercase prefix in units
 */
export const UPPERCASE_PREFIX_PATTERN = /^[KMGTPEZY]/;

/**
 * Pattern to trim trailing zeros and optional decimal point
 */
export const TRAILING_ZEROS_PATTERN = /\.?0+$/;

/**
 * Pattern to add thousands separator
 */
export const THOUSANDS_SEPARATOR_PATTERN = /\B(?=(\d{3})+(?!\d))/g;

/**
 * Maximum cache size for Intl.NumberFormat instances
 */
export const INTL_CACHE_MAX_SIZE = 100;
