import { BYTE_PATTERN, UNIT_VALIDATION_PATTERN } from "./constants";

/**
 * Checks if a string is a valid byte size format that can be parsed.
 *
 * Validates that the input string matches the expected pattern for byte sizes,
 * including a numeric value and an optional unit (e.g., "1.5 GB", "100MiB", "2TB").
 *
 * This function is useful for input validation before attempting to parse user input.
 *
 * @param {string} input - The string to validate.
 * @returns {boolean} `true` if the string is a valid byte size format, `false` otherwise.
 *          Returns `false` for non-string inputs.
 *
 * @example
 * // Valid formats
 * isBytes("1.5 GB");     // true
 * isBytes("100 MiB");    // true
 * isBytes("2TB");        // true (no space)
 * isBytes("1024");       // true (bytes implied)
 * isBytes("1,5 GB");     // true (comma decimal separator)
 * isBytes("  1 GB  ");   // true (whitespace trimmed)
 *
 * @example
 * // Invalid formats
 * isBytes("hello");      // false
 * isBytes("");           // false
 * isBytes("GB 1");       // false (wrong order)
 * isBytes(null);         // false (non-string)
 * isBytes(1024);         // false (not a string)
 */
export const isBytes = (input: string): boolean => {
  if (typeof input !== "string") {
    return false;
  }
  return BYTE_PATTERN.test(input.trim());
};

/**
 * Checks if a string is a valid byte/bit unit identifier.
 *
 * Validates that the input string is a recognized unit without a numeric value.
 * Supports SI, IEC, JEDEC, and French octet units in both short and long forms.
 *
 * @param {string} input - The string to validate as a unit.
 * @returns {boolean} `true` if the string is a valid unit, `false` otherwise.
 *          Returns `false` for non-string inputs.
 *
 * @example
 * // Valid units - IEC (binary, 1024-based)
 * isUnit("KiB");    // true
 * isUnit("MiB");    // true
 * isUnit("GiB");    // true
 *
 * @example
 * // Valid units - SI (decimal, 1000-based)
 * isUnit("kB");     // true
 * isUnit("MB");     // true
 * isUnit("GB");     // true
 *
 * @example
 * // Valid units - JEDEC (legacy)
 * isUnit("KB");     // true
 * isUnit("MB");     // true
 *
 * @example
 * // Valid units - Bits
 * isUnit("b");      // true
 * isUnit("Kib");    // true
 * isUnit("Mb");     // true
 *
 * @example
 * // Valid units - Bytes and long forms
 * isUnit("B");       // true
 * isUnit("bytes");   // true
 * isUnit("byte");    // true
 * isUnit("bits");    // true
 *
 * @example
 * // Invalid units
 * isUnit("xyz");    // false
 * isUnit("1GB");    // false (has number)
 * isUnit("");       // false
 * isUnit(null);     // false (non-string)
 */
export const isUnit = (input: string): boolean => {
  if (typeof input !== "string") {
    return false;
  }
  return UNIT_VALIDATION_PATTERN.test(input.trim());
};

/**
 * Checks if a value can be successfully parsed by the hsize `parse` function.
 *
 * This is a type guard function that validates whether the input is one of:
 * - A finite number (representing bytes)
 * - A bigint (representing bytes)
 * - A valid byte size string (e.g., "1.5 GB")
 *
 * Useful for validating user input before processing or for filtering arrays.
 *
 * @param {unknown} input - The value to check for parsability.
 * @returns {boolean} `true` if the value can be parsed, `false` otherwise.
 *
 * @example
 * // Parsable values
 * isParsable("1 GB");         // true
 * isParsable("100 MiB");      // true
 * isParsable(1024);           // true
 * isParsable(BigInt(1024));   // true
 * isParsable(0);              // true
 * isParsable(-1024);          // true
 *
 * @example
 * // Non-parsable values
 * isParsable({});             // false
 * isParsable([]);             // false
 * isParsable(null);           // false
 * isParsable(undefined);      // false
 * isParsable("hello");        // false
 * isParsable(Infinity);       // false
 * isParsable(NaN);            // false
 *
 * @example
 * // Filtering an array
 * const values = ["1 GB", "invalid", 1024, null, "2 MB"];
 * const parsable = values.filter(isParsable);
 * // ["1 GB", 1024, "2 MB"]
 *
 * @example
 * // Input validation
 * function processSize(input: unknown) {
 *   if (!isParsable(input)) {
 *     throw new Error("Invalid size input");
 *   }
 *   return parse(input as string | number | bigint);
 * }
 */
export const isParsable = (input: unknown): boolean => {
  if (typeof input === "number") {
    return Number.isFinite(input);
  }
  if (typeof input === "bigint") {
    return true;
  }
  if (typeof input === "string") {
    return isBytes(input);
  }
  return false;
};
