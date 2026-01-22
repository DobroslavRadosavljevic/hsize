import type { ExtractedByte } from "./types";

import { GLOBAL_BYTE_PATTERN } from "./constants";
import { parse } from "./parse";

/**
 * Extracts all byte size values from a text string.
 *
 * Scans through the input text and finds all valid byte size patterns
 * (e.g., "1.5 GB", "100 MiB", "2TB"). Returns an array of extracted values
 * with their parsed information and positions in the original text.
 *
 * This function is useful for:
 * - Parsing log files containing size information
 * - Extracting storage sizes from user input or documents
 * - Finding and replacing byte values in text
 * - Analyzing disk usage reports
 *
 * @param {string} text - The input text to scan for byte size values.
 * @returns {ExtractedByte[]} An array of ExtractedByte objects, each containing:
 *          - `value`: The numeric value found (e.g., 1.5 from "1.5 GB")
 *          - `unit`: The unit string (e.g., "GB")
 *          - `bytes`: The value converted to bytes
 *          - `input`: The original matched string (e.g., "1.5 GB")
 *          - `start`: Start index in the source text
 *          - `end`: End index in the source text
 *
 * @example
 * // Basic extraction
 * extract("File size: 1.5 GB");
 * // [{ value: 1.5, unit: "GB", bytes: 1610612736, input: "1.5 GB", start: 11, end: 17 }]
 *
 * @example
 * // Multiple values
 * extract("Downloaded 500 MB of 2 GB");
 * // [
 * //   { value: 500, unit: "MB", bytes: 524288000, input: "500 MB", start: 11, end: 17 },
 * //   { value: 2, unit: "GB", bytes: 2147483648, input: "2 GB", start: 21, end: 25 }
 * // ]
 *
 * @example
 * // Using positions for text replacement
 * const text = "Size: 1024 B";
 * const [match] = extract(text);
 * const newText = text.slice(0, match.start) + "1 KiB" + text.slice(match.end);
 * // "Size: 1 KiB"
 *
 * @example
 * // Summing extracted values
 * const total = extract("100 MB + 200 MB + 50 MB")
 *   .reduce((sum, item) => sum + item.bytes, 0);
 * // 367001600
 *
 * @example
 * // No matches returns empty array
 * extract("No sizes here"); // []
 */
export const extract = (text: string): ExtractedByte[] => {
  const results: ExtractedByte[] = [];

  GLOBAL_BYTE_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = GLOBAL_BYTE_PATTERN.exec(text)) !== null) {
    const extracted = processExtractMatch(match);

    if (extracted) {
      results.push(extracted);
    }
  }

  return results;
};

const processExtractMatch = (match: RegExpExecArray): ExtractedByte | null => {
  const [input, valueStr, rawUnit] = match;
  const unitStr = rawUnit ?? "B";

  // Regex guarantees valid number format, so parseFloat always succeeds
  const value = Number.parseFloat(valueStr.replace(",", "."));

  // Regex match guarantees parse will succeed (valid number + valid unit)
  const bytes = parse(input);

  return {
    bytes,
    end: match.index + input.length,
    input,
    start: match.index,
    unit: unitStr,
    value,
  };
};
