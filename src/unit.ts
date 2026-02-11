import type {
  AllUnits,
  FormatOptions,
  HSizeObject,
  HybridByte,
  IHSizeUnit,
} from "./types";

import { decimalCmp, decimalToNumber, toDecimal } from "./decimal";
import { format } from "./format";
import { parse } from "./parse";
import { resolveToBytes } from "./utils";

const ensureFiniteNumbers = (values: number[]): void => {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Expected finite number, got ${value}`);
    }
  }
};

const multiplyNumbers = (values: number[]) => {
  let product = toDecimal(1);
  for (const value of values) {
    product = product.mul(value);
  }
  return product;
};

/**
 * A chainable class for performing arithmetic operations on byte values.
 *
 * `HSizeUnit` provides a fluent API for working with byte values, allowing you to
 * perform calculations and format results using method chaining. All arithmetic
 * operations return new `HSizeUnit` instances, making the class immutable.
 *
 * The class accepts various input formats (numbers, bigints, strings like "1 GiB")
 * and can output results in multiple unit systems (SI, IEC, JEDEC).
 *
 * @example
 * // Create and chain operations
 * const result = new HSizeUnit("1 GiB")
 *   .add("500 MiB")
 *   .multiply(2)
 *   .toString();
 * // Result: "3 GiB"
 *
 * @example
 * // Use with the unit() factory function
 * import { unit } from "hsize";
 * unit("1 GiB").add("1 GiB").toSI(); // "2.15 GB"
 */
export class HSizeUnit implements IHSizeUnit {
  /**
   * The raw byte value stored by this unit.
   * This is always stored as a number of bytes, regardless of input format.
   */
  readonly bytes: number;

  /**
   * Creates a new HSizeUnit instance.
   *
   * @param {HybridByte} value - The initial byte value. Can be:
   *                - A number representing bytes
   *                - A bigint representing bytes
   *                - A string like "1.5 GiB", "100 MB", etc.
   * @throws {TypeError} If the value cannot be parsed or is not finite.
   *
   * @example
   * new HSizeUnit(1024);         // 1024 bytes
   * new HSizeUnit(BigInt(1024)); // 1024 bytes
   * new HSizeUnit("1 KiB");      // 1024 bytes
   * new HSizeUnit("1.5 GiB");    // 1610612736 bytes
   */
  constructor(value: HybridByte) {
    const bytes = resolveToBytes(value, parse);
    if (!Number.isFinite(bytes)) {
      throw new TypeError(`Invalid byte value: ${value}`);
    }
    this.bytes = bytes;
  }

  /**
   * Adds one or more byte values to the current value.
   *
   * @param {HybridByte | HybridByte[]} value - A single byte value or array of byte values to add.
   *                Each value can be a number, bigint, or string.
   * @returns {HSizeUnit} A new HSizeUnit with the sum.
   *
   * @example
   * unit(1024).add(1024).bytes;           // 2048
   * unit("1 KiB").add("1 KiB").bytes;     // 2048
   * unit(0).add([1024, "1 KiB"]).bytes;   // 2048
   */
  add(value: HybridByte | HybridByte[]): HSizeUnit {
    const values = Array.isArray(value) ? value : [value];
    let sum = toDecimal(0);
    for (const currentValue of values) {
      sum = sum.plus(resolveToBytes(currentValue, parse));
    }
    return new HSizeUnit(decimalToNumber(toDecimal(this.bytes).plus(sum)));
  }

  /**
   * Subtracts one or more byte values from the current value.
   *
   * @param {HybridByte | HybridByte[]} value - A single byte value or array of byte values to subtract.
   *                Each value can be a number, bigint, or string.
   * @returns {HSizeUnit} A new HSizeUnit with the difference. May be negative.
   *
   * @example
   * unit(2048).subtract(1024).bytes;         // 1024
   * unit("2 KiB").subtract("1 KiB").bytes;   // 1024
   * unit("1 GiB").subtract(["500 MiB", "256 MiB"]).toString(); // "268 MiB"
   */
  subtract(value: HybridByte | HybridByte[]): HSizeUnit {
    const values = Array.isArray(value) ? value : [value];
    let sum = toDecimal(0);
    for (const currentValue of values) {
      sum = sum.plus(resolveToBytes(currentValue, parse));
    }
    return new HSizeUnit(decimalToNumber(toDecimal(this.bytes).minus(sum)));
  }

  /**
   * Multiplies the current byte value by one or more numbers.
   *
   * When multiple values are provided, they are multiplied together first,
   * then the result multiplies the byte value.
   *
   * @param {number | number[]} value - A single number or array of numbers to multiply by.
   * @returns {HSizeUnit} A new HSizeUnit with the product.
   * @throws {TypeError} If any multiplier is not a finite number.
   *
   * @example
   * unit(1024).multiply(2).bytes;       // 2048
   * unit("1 KiB").multiply(1.5).bytes;  // 1536
   * unit(100).multiply([2, 3]).bytes;   // 600 (100 * 2 * 3)
   */
  multiply(value: number | number[]): HSizeUnit {
    const values = Array.isArray(value) ? value : [value];
    ensureFiniteNumbers(values);
    const product = multiplyNumbers(values);
    const nextBytes = decimalToNumber(toDecimal(this.bytes).mul(product));
    return new HSizeUnit(nextBytes);
  }

  /**
   * Divides the current byte value by one or more numbers.
   *
   * When multiple values are provided, they are multiplied together first,
   * then the byte value is divided by the result.
   *
   * @param {number | number[]} value - A single number or array of numbers to divide by.
   * @returns {HSizeUnit} A new HSizeUnit with the quotient.
   * @throws {TypeError} If any divisor is not a finite number or if dividing by zero.
   *
   * @example
   * unit(2048).divide(2).bytes;       // 1024
   * unit("1 GiB").divide(2).toString(); // "512 MiB"
   * unit(1200).divide([2, 3]).bytes;  // 200 (1200 / (2 * 3))
   */
  divide(value: number | number[]): HSizeUnit {
    const values = Array.isArray(value) ? value : [value];
    ensureFiniteNumbers(values);
    const product = multiplyNumbers(values);
    if (decimalCmp(product, 0) === 0) {
      throw new TypeError("Division by zero");
    }
    const nextBytes = decimalToNumber(toDecimal(this.bytes).div(product));
    return new HSizeUnit(nextBytes);
  }

  /**
   * Formats the byte value using a specific unit.
   *
   * @param {AllUnits} unit - The target unit (e.g., "KiB", "MB", "GiB").
   * @param {FormatOptions} [options] - Additional formatting options.
   * @returns {string} A formatted string with the specified unit.
   *
   * @example
   * unit(1073741824).to("MiB");           // "1024 MiB"
   * unit(1073741824).to("GiB");           // "1 GiB"
   * unit(1073741824).to("GB", { system: "si" }); // "1.07 GB"
   */
  to(unit: AllUnits, options?: FormatOptions): string {
    return format(this.bytes, { ...options, unit });
  }

  /**
   * Formats the byte value using SI units (1000-based).
   *
   * SI (International System of Units) uses powers of 1000:
   * kB, MB, GB, TB, PB, EB, ZB, YB
   *
   * @param {FormatOptions} [options] - Additional formatting options.
   * @returns {string} A formatted string using SI units.
   *
   * @example
   * unit(1000).toSI();     // "1 kB"
   * unit(1000000).toSI();  // "1 MB"
   * unit(1024).toSI();     // "1.02 kB"
   */
  toSI(options?: FormatOptions): string {
    return format(this.bytes, { ...options, system: "si" });
  }

  /**
   * Formats the byte value using IEC units (1024-based).
   *
   * IEC (International Electrotechnical Commission) uses powers of 1024:
   * KiB, MiB, GiB, TiB, PiB, EiB, ZiB, YiB
   *
   * This is the default formatting system.
   *
   * @param {FormatOptions} [options] - Additional formatting options.
   * @returns {string} A formatted string using IEC units.
   *
   * @example
   * unit(1024).toIEC();       // "1 KiB"
   * unit(1048576).toIEC();    // "1 MiB"
   * unit(1073741824).toIEC(); // "1 GiB"
   */
  toIEC(options?: FormatOptions): string {
    return format(this.bytes, { ...options, system: "iec" });
  }

  /**
   * Formats the byte value using JEDEC units (1024-based with SI names).
   *
   * JEDEC is the legacy standard used by Windows and some applications.
   * Uses powers of 1024 but with SI-style names: KB, MB, GB, TB, etc.
   *
   * @param {FormatOptions} [options] - Additional formatting options.
   * @returns {string} A formatted string using JEDEC units.
   *
   * @example
   * unit(1024).toJEDEC();       // "1 KB"
   * unit(1048576).toJEDEC();    // "1 MB"
   * unit(1073741824).toJEDEC(); // "1 GB"
   */
  toJEDEC(options?: FormatOptions): string {
    return format(this.bytes, { ...options, system: "jedec" });
  }

  /**
   * Formats the byte value as bits instead of bytes.
   *
   * Multiplies the byte value by 8 and formats with bit units.
   *
   * @param {FormatOptions} [options] - Additional formatting options.
   * @returns {string} A formatted string using bit units.
   *
   * @example
   * unit(1024).toBits();     // "8 Kib"
   * unit(1048576).toBits();  // "8 Mib"
   * unit(125000).toBits({ system: "si" }); // "1 Mb"
   */
  toBits(options?: FormatOptions): string {
    return format(this.bytes, { ...options, bits: true });
  }

  /**
   * Returns the raw byte value as a number.
   *
   * This method is called automatically when the object is used in
   * numeric contexts (arithmetic operations, comparisons, etc.).
   *
   * @returns {number} The byte value as a number.
   *
   * @example
   * unit(1024).valueOf();        // 1024
   * unit(1024) + unit(1024);     // 2048 (valueOf called implicitly)
   * unit(1024) > unit(512);      // true
   */
  valueOf(): number {
    return this.bytes;
  }

  /**
   * Formats the byte value as a human-readable string.
   *
   * This method is called automatically when the object is converted to a string.
   * Uses IEC units by default.
   *
   * @param {FormatOptions} [options] - Formatting options to customize the output.
   * @returns {string} A formatted string representation.
   *
   * @example
   * unit(1024).toString();                    // "1 KiB"
   * unit(1024).toString({ system: "si" });    // "1.02 kB"
   * String(unit(1024));                       // "1 KiB"
   * `Size: ${unit(1024)}`;                    // "Size: 1 KiB"
   */
  toString(options?: FormatOptions): string {
    return format(this.bytes, options);
  }

  /**
   * Converts the byte value to a JSON-serializable object.
   *
   * This method is called automatically by `JSON.stringify()`.
   *
   * @returns {HSizeObject} An object with value, unit, bytes, and exponent properties.
   *
   * @example
   * unit(1073741824).toJSON();
   * // { value: 1, unit: "GiB", bytes: 1073741824, exponent: 3 }
   *
   * JSON.stringify(unit(1024));
   * // '{"value":1,"unit":"KiB","bytes":1024,"exponent":1}'
   */
  toJSON(): HSizeObject {
    return format(this.bytes, { output: "object" });
  }
}

/**
 * Creates a new chainable HSizeUnit instance.
 *
 * This is a convenience factory function that creates an HSizeUnit,
 * providing a fluent API for byte value calculations.
 *
 * @param {HybridByte} value - The initial byte value. Can be:
 *                - A number representing bytes
 *                - A bigint representing bytes
 *                - A string like "1.5 GiB", "100 MB", etc.
 * @returns {HSizeUnit} A new HSizeUnit instance for chaining operations.
 * @throws {TypeError} If the value cannot be parsed or is not finite.
 *
 * @example
 * // Basic usage
 * unit(1024).toString();           // "1 KiB"
 * unit("1 GiB").bytes;             // 1073741824
 *
 * @example
 * // Chaining operations
 * unit("1 GiB")
 *   .add("500 MiB")
 *   .multiply(2)
 *   .toString();                   // "3 GiB"
 *
 * @example
 * // Different output formats
 * unit(1073741824).toSI();         // "1.07 GB"
 * unit(1073741824).toIEC();        // "1 GiB"
 * unit(1073741824).toJEDEC();      // "1 GB"
 *
 * @example
 * // Arithmetic comparisons (uses valueOf())
 * unit("1 GiB") > unit("500 MiB"); // true
 */
export const unit = (value: HybridByte): HSizeUnit => new HSizeUnit(value);
