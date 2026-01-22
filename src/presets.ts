import type { ByteValue, FormatOptions } from "./types";

import { format } from "./format";

/**
 * Pre-configured option sets for common use cases.
 *
 * @example
 * import { presets, format } from "hsize";
 *
 * format(1000, presets.storage);  // "1 kB"
 * format(1024, presets.memory);   // "1 KiB"
 * format(1000, presets.network);  // "8 kb"
 */
export const presets = {
  /**
   * Compact preset - minimal output without space.
   * No decimals and no space between value and unit.
   */
  compact: { decimals: 0, space: false },

  /**
   * File preset - for file listings, downloads.
   * Uses IEC units with 2 decimal places and short form.
   */
  file: { decimals: 2, longForm: false, system: "iec" },

  /**
   * Memory preset - for RAM, heap sizes, buffers.
   * Uses IEC units (1024-based) with 2 decimal places.
   */
  memory: { decimals: 2, system: "iec" },

  /**
   * Network preset - for bandwidth, transfer speeds.
   * Uses SI bits with 1 decimal place.
   */
  network: { bits: true, decimals: 1, system: "si" },

  /**
   * Precise preset - high precision with padding.
   * 4 decimal places with trailing zeros.
   */
  precise: { decimals: 4, pad: true },

  /**
   * Storage preset - for disk storage, file sizes.
   * Uses SI units (1000-based) with 1 decimal place.
   */
  storage: { decimals: 1, system: "si" },
} as const satisfies Record<string, FormatOptions>;

/**
 * Type representing all available preset names.
 */
export type PresetName = keyof typeof presets;

/**
 * Formats bytes using the storage preset.
 *
 * Uses SI units (1000-based) with 1 decimal place.
 * Ideal for disk storage, file sizes, and cloud storage.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatStorage(1000);       // "1 kB"
 * formatStorage(1500000);    // "1.5 MB"
 * formatStorage(1000000000); // "1 GB"
 */
export const formatStorage = (bytes: ByteValue): string =>
  format(bytes, presets.storage);

/**
 * Formats bytes using the memory preset.
 *
 * Uses IEC units (1024-based) with 2 decimal places.
 * Ideal for RAM, heap sizes, and buffers.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatMemory(1024);         // "1 KiB"
 * formatMemory(1073741824);   // "1 GiB"
 * formatMemory(2147483648);   // "2 GiB"
 */
export const formatMemory = (bytes: ByteValue): string =>
  format(bytes, presets.memory);

/**
 * Formats bytes using the network preset.
 *
 * Uses SI bits (1000-based) with 1 decimal place.
 * Ideal for bandwidth, transfer speeds, and network throughput.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatNetwork(125);        // "1 kb"
 * formatNetwork(125000);     // "1 Mb"
 * formatNetwork(125000000);  // "1 Gb"
 */
export const formatNetwork = (bytes: ByteValue): string =>
  format(bytes, presets.network);

/**
 * Formats bytes using the compact preset.
 *
 * No decimals and no space between value and unit.
 * Ideal for space-constrained displays, badges, and compact UIs.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatCompact(1024);        // "1KiB"
 * formatCompact(1073741824);  // "1GiB"
 * formatCompact(1536);        // "2KiB"
 */
export const formatCompact = (bytes: ByteValue): string =>
  format(bytes, presets.compact);

/**
 * Formats bytes using the precise preset.
 *
 * 4 decimal places with trailing zero padding.
 * Ideal for scientific or technical applications requiring high precision.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatPrecise(1024);  // "1.0000 KiB"
 * formatPrecise(1536);  // "1.5000 KiB"
 */
export const formatPrecise = (bytes: ByteValue): string =>
  format(bytes, presets.precise);

/**
 * Formats bytes using the file preset.
 *
 * Uses IEC units (1024-based) with 2 decimal places.
 * Ideal for file listings, downloads, and file managers.
 *
 * @param {ByteValue} bytes - The byte value to format
 * @returns {string} Formatted string
 *
 * @example
 * formatFile(1024);         // "1 KiB"
 * formatFile(1073741824);   // "1 GiB"
 */
export const formatFile = (bytes: ByteValue): string =>
  format(bytes, presets.file);
