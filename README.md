# 📦 hsize

> The ultimate TypeScript library for human-readable byte formatting and parsing.

[![npm version](https://img.shields.io/npm/v/hsize.svg)](https://www.npmjs.com/package/hsize)
[![bundle size](https://img.shields.io/bundlephobia/minzip/hsize)](https://bundlephobia.com/package/hsize)
[![license](https://img.shields.io/npm/l/hsize.svg)](https://github.com/dobroslavradosavljevic/hsize/blob/main/LICENSE)

**hsize** converts bytes to human-readable strings and vice versa. It supports multiple unit systems (SI, IEC, JEDEC), localization, BigInt, chainable operations, and more!

## ✨ Features

- 🎯 **Polymorphic API** - One function for formatting and parsing
- 🔢 **Multiple Unit Systems** - SI (1000), IEC (1024), JEDEC
- 🌍 **Full Localization** - Intl.NumberFormat support
- 🔗 **Chainable Operations** - Arithmetic with byte values
- 📝 **Text Extraction** - Find byte values in any text
- 🏭 **Factory Pattern** - Pre-configured instances
- 💪 **BigInt Support** - Handle massive numbers with strict mode
- ✅ **Validation Helpers** - Check if strings are valid byte values
- 📦 **Zero Dependencies** - Lightweight (~6KB gzipped)
- 🔷 **TypeScript First** - Full type safety with overloads

## 📥 Installation

```bash
npm install hsize
```

```bash
pnpm add hsize
```

```bash
yarn add hsize
```

```bash
bun add hsize
```

## 🚀 Quick Start

```typescript
import hsize, { format, parse } from "hsize";

// Format bytes to human-readable string
format(1024); // "1 KiB"
format(1500000); // "1.43 MiB"

// Parse human-readable string to bytes
parse("1 KiB"); // 1024
parse("1.5 MB"); // 1500000

// Or use the polymorphic main function
hsize(1024); // "1 KiB"
hsize("1 KiB"); // 1024
```

## 📖 API Reference

### 🎨 format(bytes, options?)

Convert bytes to a human-readable string.

```typescript
import { format } from "hsize";

// Basic usage
format(0); // "0 B"
format(1024); // "1 KiB"
format(1536); // "1.5 KiB"
format(1073741824); // "1 GiB"

// With options
format(1000, { system: "si" }); // "1 kB"
format(1024, { system: "jedec" }); // "1 KB"
format(1024, { bits: true }); // "8 Kib"
format(1536, { decimals: 3 }); // "1.500 KiB"
format(1024, { signed: true }); // "+1 KiB"
format(1024, { longForm: true }); // "1 kibibyte"
format(2048, { longForm: true }); // "2 kibibytes"
```

#### Format Options

| Option             | Type                                                  | Default    | Description                          |
| ------------------ | ----------------------------------------------------- | ---------- | ------------------------------------ |
| `system`           | `"si"` \| `"iec"` \| `"jedec"`                        | `"iec"`    | Unit system to use                   |
| `bits`             | `boolean`                                             | `false`    | Format as bits instead of bytes      |
| `decimals`         | `number`                                              | `2`        | Number of decimal places             |
| `signed`           | `boolean`                                             | `false`    | Show `+` for positive numbers        |
| `space`            | `boolean`                                             | `true`     | Include space between value and unit |
| `spacer`           | `string`                                              | `" "`      | Custom spacer string                 |
| `nonBreakingSpace` | `boolean`                                             | `false`    | Use non-breaking space (U+00A0)      |
| `locale`           | `string` \| `boolean`                                 | -          | Locale for number formatting         |
| `longForm`         | `boolean`                                             | `false`    | Use long unit names                  |
| `unit`             | `string`                                              | -          | Force specific unit                  |
| `exponent`         | `number` (integer 0-8)                                | -          | Force specific exponent level        |
| `fixedWidth`       | `number`                                              | -          | Pad output to fixed width            |
| `output`           | `"string"` \| `"array"` \| `"object"` \| `"exponent"` | `"string"` | Output format                        |

#### Output Formats

```typescript
// String (default)
format(1024); // "1 KiB"

// Array
format(1024, { output: "array" }); // [1, "KiB"]

// Object
format(1024, { output: "object" });
// { bytes: 1024, value: 1, unit: "KiB", exponent: 1 }

// Exponent only
format(1024, { output: "exponent" }); // 1
```

### 🔍 parse(input, options?)

Parse a human-readable string to bytes.

```typescript
import { parse } from "hsize";

// Basic usage
parse("1 KiB"); // 1024
parse("1.5 MB"); // 1572864 (JEDEC: 1024-based)
parse("1.5 mb"); // 1500000 (SI: 1000-based)
parse("100 B"); // 100
parse("1,5 GiB"); // 1610612736 (European decimals)

// Pass through numbers
parse(1024); // 1024
parse(1024n); // 1024

// French octets
parse("1 ko"); // 1000
parse("1 Mo"); // 1000000
parse("1 Go"); // 1000000000

// Strict mode (throws on invalid input)
parse("invalid", { strict: true }); // throws TypeError
parse("invalid"); // NaN
```

#### Parse Options

| Option   | Type                  | Default | Description                            |
| -------- | --------------------- | ------- | -------------------------------------- |
| `strict` | `boolean`             | `false` | Throw on invalid input                 |
| `locale` | `string` \| `boolean` | -       | Locale for number parsing              |
| `iec`    | `boolean`             | `true`  | Treat ambiguous units as IEC           |
| `bits`   | `boolean`             | `false` | Interpret values as bits (divide by 8) |

#### Parsing Bits

```typescript
// Parse bit units (automatically detected)
parse("8 kilobits"); // 1000 (1000 bits = 125 bytes, but returns bits/8)
parse("8 kibibits"); // 1024

// Force bit interpretation with option
parse("1000", { bits: true }); // 125 (1000 bits = 125 bytes)
```

### 📝 extract(text)

Extract byte values from any text.

```typescript
import { extract } from "hsize";

const text = "Downloaded 150MB in 30s, 5MB/s average";
const results = extract(text);

// [
//   { value: 150, unit: "MB", bytes: 157286400, input: "150MB", start: 11, end: 16 },
//   { value: 5, unit: "MB", bytes: 5242880, input: "5MB", start: 25, end: 28 }
// ]

// Great for parsing logs, system info, etc.
extract("RAM: 16 GiB, Disk: 512 GB free");
extract("File size: 2.5 MiB");
```

### 🔗 unit(value)

Create a chainable unit object for arithmetic operations.

```typescript
import { unit } from "hsize";

// Create from any format
const size = unit(1024); // from number
const size2 = unit("1 MiB"); // from string
const size3 = unit(1024n); // from BigInt

// Arithmetic operations
unit("1 MiB")
  .add("512 KiB")
  .multiply(2)
  .subtract("256 KiB")
  .divide(2)
  .toString(); // "896 KiB"

// Add/subtract arrays
unit("1 GiB").add(["100 MiB", "200 MiB"]);
unit("1 GiB").subtract(["100 MiB", "200 MiB"]);

// Multiply/divide by arrays (sequentially)
unit("1 KiB").multiply([2, 2, 2]); // 8 KiB
unit("8 KiB").divide([2, 2, 2]); // 1 KiB

// Convert to different systems
unit(1048576).toSI(); // "1.05 MB"
unit(1048576).toIEC(); // "1 MiB"
unit(1048576).toJEDEC(); // "1 MB"
unit(1048576).toBits(); // "8 Mib"
unit(1048576).to("KiB"); // "1024 KiB"

// Standard methods
unit(1024).valueOf(); // 1024 (for arithmetic)
unit(1024).toString(); // "1 KiB"
unit(1024).toJSON(); // { bytes: 1024, value: 1, unit: "KiB", exponent: 1 }
```

### 🏭 create(config?)

Create a pre-configured hsize instance.

```typescript
import { create } from "hsize";

// Create SI-configured instance (for marketing/storage)
const marketing = create({ system: "si" });
marketing.format(1000000000); // "1 GB"
marketing.parse("1 GB"); // 1000000000

// Create localized instance
const german = create({ locale: "de-DE", decimals: 2 });
german.format(1536); // "1,50 KiB"

// Instance has all methods
const instance = create({ system: "iec" });
instance.format(1024); // format
instance.parse("1 KiB"); // parse
instance.extract("1 KiB file"); // extract
instance.unit("1 KiB"); // unit
instance.create({ decimals: 3 }); // nested create
```

### 🔧 Utility Functions

Convenient functions for creating byte values.

```typescript
import { kb, mb, gb, tb, kib, mib, gib, tib } from "hsize";

// SI units (1000-based)
kb(5); // 5000
mb(2); // 2000000
gb(1); // 1000000000
tb(1); // 1000000000000

// IEC units (1024-based)
kib(5); // 5120
mib(2); // 2097152
gib(1); // 1073741824
tib(1); // 1099511627776

// Use in calculations
const fileSize = mib(100); // 104857600
const bandwidth = mb(10); // 10000000
```

## 📊 Unit Systems

| System    | Base | Units         | Use Case                          |
| --------- | ---- | ------------- | --------------------------------- |
| **IEC**   | 1024 | KiB, MiB, GiB | File sizes, RAM (recommended)     |
| **SI**    | 1000 | kB, MB, GB    | Storage marketing, network speeds |
| **JEDEC** | 1024 | KB, MB, GB    | Windows, legacy software          |

```typescript
// IEC (default) - Unambiguous, technically correct
format(1024, { system: "iec" }); // "1 KiB"

// SI - Used in storage marketing
format(1000, { system: "si" }); // "1 kB"

// JEDEC - Windows-style (legacy)
format(1024, { system: "jedec" }); // "1 KB"
```

## 🌍 Localization

Full support for international number formatting.

```typescript
// German locale
format(1536, { locale: "de-DE" }); // "1,5 KiB"

// French locale
format(1536, { locale: "fr-FR" }); // "1,5 KiB"

// System locale
format(1536, { locale: true }); // Uses browser/system locale

// Parse European decimals
parse("1,5 KiB"); // 1536

// Custom locale options
format(1536, {
  locale: "en-US",
  localeOptions: { minimumFractionDigits: 2 },
}); // "1.50 KiB"
```

## 💪 BigInt Support

Handle numbers larger than `Number.MAX_SAFE_INTEGER`.

```typescript
// Format BigInt values
format(1099511627776n); // "1 TiB"
format(1180591620717411303424n); // "1 ZiB"

// Parse to BigInt-safe values
parse("1 YiB"); // 1.2089258196146292e+24

// Use in calculations
const huge = unit(1099511627776n);
huge.multiply(1000).toString(); // "976.56 TiB"

// Strict mode throws for precision loss
const unsafe = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
parse(unsafe, { strict: true }); // throws RangeError
parse(unsafe); // warns and returns approximate value
```

## ✅ Validation Helpers

Validate byte strings before parsing.

```typescript
import { isBytes, isUnit, isParsable } from "hsize";

// Check if a string is a valid byte string
isBytes("1 KB"); // true
isBytes("1.5 GiB"); // true
isBytes("100"); // true (plain numbers are valid)
isBytes("hello"); // false
isBytes(""); // false

// Check if a string is a valid unit
isUnit("KB"); // true
isUnit("MiB"); // true
isUnit("bytes"); // true
isUnit("bits"); // true
isUnit("xyz"); // false

// Check if any value is parsable
isParsable("1 KB"); // true
isParsable(1024); // true
isParsable(1024n); // true
isParsable("hello"); // false
isParsable(NaN); // false
isParsable({}); // false
```

## 🔍 Exported Patterns

Use the regex patterns directly for custom parsing needs.

```typescript
import { BYTE_PATTERN, GLOBAL_BYTE_PATTERN } from "hsize";

// BYTE_PATTERN - matches a single byte string (anchored)
BYTE_PATTERN.test("1 KB"); // true
BYTE_PATTERN.test("invalid"); // false

// GLOBAL_BYTE_PATTERN - finds all byte strings in text
const text = "Download: 10 MB, Upload: 5 MB";
const matches = text.match(GLOBAL_BYTE_PATTERN);
// ["10 MB", "5 MB"]

// Use in custom validation
const isValidSize = (str: string) => BYTE_PATTERN.test(str.trim());
```

## 🎯 Real-World Examples

### File Size Display

```typescript
import { format } from "hsize";

function formatFileSize(bytes: number): string {
  return format(bytes, { decimals: 1 });
}

formatFileSize(4096); // "4 KiB"
formatFileSize(1234567); // "1.2 MiB"
formatFileSize(500000000); // "476.8 MiB"
```

### Download Progress

```typescript
import { format, parse, unit } from "hsize";

const totalSize = parse("1 GiB");
const downloaded = parse("750 MiB");
const remaining = unit(totalSize).subtract(downloaded);

console.log(`Downloaded: ${format(downloaded)}`); // "750 MiB"
console.log(`Remaining: ${remaining.toString()}`); // "274 MiB"
console.log(`Progress: ${((downloaded / totalSize) * 100).toFixed(1)}%`); // "69.9%"
```

### Storage Calculator

```typescript
import { format, parse, unit } from "hsize";

// Calculate total from multiple files
const files = ["10 MiB", "25 MiB", "100 MiB", "5 MiB"];
const total = files.reduce((acc, f) => acc + parse(f), 0);
console.log(`Total: ${format(total)}`); // "140 MiB"

// Split storage evenly
const storage = unit("1 TiB");
const perUser = storage.divide(100);
console.log(`Per user: ${perUser.toString()}`); // "10.24 GiB"
```

### Network Bandwidth

```typescript
import { format } from "hsize";

// Display bandwidth in bits (SI)
const bytesPerSec = 12500000;
const bitsPerSec = format(bytesPerSec, { bits: true, system: "si" });
console.log(`Speed: ${bitsPerSec}/s`); // "100 Mb/s"
```

### Parse Log Files

```typescript
import { extract } from "hsize";

const log = `
[INFO] Downloaded 150MB in 30 seconds
[INFO] Cache size: 2.5 GiB
[WARN] Low disk space: 500 MB remaining
`;

const sizes = extract(log);
sizes.forEach((s) => {
  console.log(`Found: ${s.input} = ${s.bytes} bytes`);
});
```

## ⚠️ Error Handling

The library provides consistent error handling with configurable strictness.

```typescript
import { parse, format, unit } from "hsize";

// parse() - returns NaN by default, throws in strict mode
parse("invalid"); // NaN
parse("invalid", { strict: true }); // throws TypeError

// format() - always throws for invalid input
format(NaN); // throws TypeError
format(Infinity); // throws TypeError

// unit() - throws for invalid values
unit("invalid"); // throws TypeError
unit(NaN); // throws TypeError

// Arithmetic validation
unit(1024).multiply(NaN); // throws TypeError
unit(1024).multiply(Infinity); // throws TypeError
unit(1024).divide(0); // throws TypeError (division by zero)

// BigInt precision loss
const huge = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
parse(huge); // warns, returns approximate value
parse(huge, { strict: true }); // throws RangeError
```

## 🔷 TypeScript

Full TypeScript support with comprehensive types.

```typescript
import type {
  FormatOptions,
  ParseOptions,
  HSizeObject,
  HSizeArray,
  ByteValue,
  AllUnits,
  ExtractedByte,
} from "hsize";

// Type-safe options
const options: FormatOptions = {
  system: "iec",
  decimals: 2,
  locale: "en-US",
};

// Type-safe output - return type inferred from options
import { format } from "hsize";

const str = format(1024); // string
const arr = format(1024, { output: "array" }); // [number, string]
const obj = format(1024, { output: "object" }); // HSizeObject
const exp = format(1024, { output: "exponent" }); // number

// Validation helpers are fully typed
import { isBytes, isUnit, isParsable } from "hsize";

if (isBytes(userInput)) {
  // userInput is validated as a byte string
  const bytes = parse(userInput);
}

if (isParsable(value)) {
  // value is string | number | bigint
  const bytes = parse(value);
}
```

## 📜 License

MIT © [Dobroslav Radosavljevic](https://github.com/dobroslavradosavljevic)

---

_Made with ❤️ for developers who need human-readable bytes_
