# 📦 hsize

> The ultimate TypeScript library for human-readable byte formatting and parsing.

[![npm version](https://img.shields.io/npm/v/hsize.svg)](https://www.npmjs.com/package/hsize)
[![bundle size](https://img.shields.io/bundlephobia/minzip/hsize)](https://bundlephobia.com/package/hsize)
[![license](https://img.shields.io/npm/l/hsize.svg)](https://github.com/dobroslavradosavljevic/hsize/blob/main/LICENSE)
![no dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

**hsize** is a zero-dependency library that converts bytes to human-readable strings and vice versa. It supports multiple unit systems (SI, IEC, JEDEC), localization, BigInt, chainable operations, comparisons, rate formatting, and much more!

## ✨ Features

- 🎯 **Polymorphic API** - One function for formatting and parsing
- 🔢 **Multiple Unit Systems** - SI (1000), IEC (1024), JEDEC
- 🌍 **Full Localization** - Intl.NumberFormat support
- 🔗 **Chainable Operations** - Arithmetic with byte values
- ⚖️ **Comparison Functions** - Compare byte values directly
- 🚀 **Rate/Speed Formatting** - Format transfer speeds (MB/s, Mbps)
- 📝 **Text Extraction** - Find byte values in any text
- 🗣️ **Natural Language Parsing** - Parse "about 2 gigs" or "half a terabyte"
- 🏭 **Factory Pattern** - Pre-configured instances with custom units
- 🎛️ **Presets** - Built-in presets for storage, memory, network
- 📊 **Aggregates** - Sum, average, median of byte values
- 💪 **BigInt Support** - Handle massive numbers with strict mode
- 💻 **CLI Tool** - Command-line interface included
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
format(1536, { decimals: 3 }); // "1.5 KiB"
format(1024, { signed: true }); // "+1 KiB"
format(1024, { longForm: true }); // "1 kibibyte"
format(2048, { longForm: true }); // "2 kibibytes"

// Template formatting
format(1536, { template: "{value}{unit}" }); // "1.5KiB"
format(1536, { template: "{bytes} bytes = {value} {unit}" }); // "1536 bytes = 1.5 KiB"
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
| `template`         | `string`                                              | -          | Custom format template               |
| `output`           | `"string"` \| `"array"` \| `"object"` \| `"exponent"` | `"string"` | Output format                        |

#### Template Placeholders

| Placeholder  | Description                      |
| ------------ | -------------------------------- |
| `{value}`    | The formatted numeric value      |
| `{unit}`     | The unit symbol (KiB, MB, etc.)  |
| `{longUnit}` | The long form unit name          |
| `{bytes}`    | The original byte value          |
| `{exponent}` | The exponent level (0=B, 1=K...) |

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

### 🗣️ parseNatural(text, options?)

Parse informal, natural language byte descriptions.

```typescript
import { parseNatural } from "hsize";

// Informal units
parseNatural("2 gigs"); // 2147483648
parseNatural("500 megs"); // 524288000
parseNatural("1 tera"); // 1099511627776

// Approximation words
parseNatural("about 2 gigs"); // 2147483648
parseNatural("around 500 megs"); // 524288000
parseNatural("roughly 1 tera"); // 1099511627776

// Fractions
parseNatural("half a terabyte"); // 549755813888
parseNatural("quarter of a gig"); // 268435456

// Quantities
parseNatural("a couple gigs"); // 2147483648
parseNatural("a few hundred megs"); // 314572800
parseNatural("several gigs"); // 5368709120
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

### ⚖️ Comparison Functions

Compare byte values directly without manual parsing.

```typescript
import { gt, gte, lt, lte, eq, between, min, max } from "hsize";

// Greater than / less than
gt("2 GB", "1 GB"); // true
lt("500 MB", "1 GB"); // true
gte("1 GiB", "1 GiB"); // true
lte("1 GiB", "1 GiB"); // true

// Equality
eq("1 KiB", 1024); // true
eq("1024 B", "1 KiB"); // true

// Range check
between("500 MB", "100 MB", "1 GB"); // true

// Min/max
min("1 GB", "500 MB", "2 TB"); // 524288000 (500 MB in bytes)
max("1 GB", "500 MB", "2 TB"); // 2199023255552 (2 TB in bytes)
```

### 🚀 Rate/Speed Formatting

Format and parse transfer speeds.

```typescript
import { formatRate, parseRate } from "hsize";

// Format rates
formatRate(1024); // "1 KiB/s"
formatRate(1536000); // "1.46 MiB/s"
formatRate(1024, { interval: "minute" }); // "60 KiB/min"
formatRate(1024, { interval: "hour" }); // "3.52 MiB/h"

// Network speeds in bits
formatRate(125000, { bits: true, system: "si" }); // "1 Mb/s"
formatRate(125000000, { bits: true, system: "si" }); // "1 Gb/s"

// Parse rates
parseRate("1 KiB/s"); // { bytesPerSecond: 1024, value: 1, unit: "KiB", interval: "second", bits: false }
parseRate("10 Mbps"); // { bytesPerSecond: 1250000, value: 10, unit: "Mb", interval: "second", bits: true }
parseRate("60 KiB/min"); // { bytesPerSecond: 1024, ... }
```

### 📈 Diff/Delta Formatting

Show the difference between two sizes.

```typescript
import { diff } from "hsize";

// Basic differences
diff("1 GB", "1.5 GB"); // "+500 MiB"
diff("2 GB", "1 GB"); // "-1 GiB"
diff("1 GB", "1 GB"); // "0 B"

// With percentage
diff("1 GB", "1.5 GB", { percentage: true }); // "+500 MiB (+50%)"
diff("1 GB", "2 GB", { percentage: true }); // "+1 GiB (+100%)"

// Unsigned
diff("1 GB", "1.5 GB", { signed: false }); // "512 MiB"
```

### 📏 Range Formatting

Format byte ranges elegantly.

```typescript
import { formatRange } from "hsize";

// Basic ranges
formatRange(1024, 2048); // "1 KiB – 2 KiB"
formatRange("500 MB", "2 GB"); // "500 MiB – 2 GiB"

// Collapses when equal (default)
formatRange(1024, 1024); // "1 KiB"
formatRange(1024, 1024, { collapse: false }); // "1 KiB – 1 KiB"

// Custom separator
formatRange(1024, 2048, { separator: " to " }); // "1 KiB to 2 KiB"
```

### 🎯 Approximate Formatting

Human-friendly approximations.

```typescript
import { approximate } from "hsize";

// Symbol style (default)
approximate(1500000000); // "~1.4 GiB"
approximate(999000000, { system: "si" }); // "almost 1 GB"
approximate(1010000000, { system: "si" }); // "just over 1 GB"

// Verbose style
approximate(1500000000, { style: "verbose" }); // "about 1.4 GiB"

// Exact values have no prefix
approximate(1073741824); // "1 GiB"
```

### 💯 Percentage Calculations

Calculate percentages of byte sizes.

```typescript
import { percent, percentOf, remaining } from "hsize";

// Calculate percentage
percent("512 MiB", "1 GiB"); // 50
percent("1 GB", "4 GB"); // 25

// Calculate percentage of a size
percentOf(50, "1 GiB"); // 536870912 (bytes)
percentOf(25, "4 GiB", { format: true }); // "1 GiB"

// Calculate remaining space
remaining("300 MiB", "1 GiB"); // 759169024 (bytes)
remaining("256 MiB", "1 GiB", { format: true }); // "768 MiB"
```

### 📊 Aggregate Functions

Work with collections of byte values.

```typescript
import { sum, average, median } from "hsize";

// Sum
sum(["1 GB", "500 MB", "256 KiB"]); // returns bytes
sum(["1 GB", "500 MB"], { format: true }); // "1.49 GiB"

// Average
average(["1 GB", "2 GB", "3 GB"]); // returns bytes
average(["1 GB", "2 GB", "3 GB"], { format: true }); // "2 GiB"

// Median
median(["1 GB", "2 GB", "10 GB"]); // returns 2GB in bytes
median(["1 GB", "2 GB", "10 GB"], { format: true }); // "2 GiB"
```

### 🔒 Clamp Function

Constrain values to a range.

```typescript
import { clamp } from "hsize";

// Clamp to minimum
clamp("500 KB", { min: "1 MB" }); // 1048576 (1 MB)
clamp("500 KB", { min: "1 MB", format: true }); // "1 MiB"

// Clamp to maximum
clamp("2 TB", { max: "1 GB" }); // 1073741824 (1 GB)
clamp("2 TB", { max: "1 GB", format: true }); // "1 GiB"

// Clamp to range
clamp("50 MB", { min: "100 MB", max: "1 GB", format: true }); // "100 MiB"
clamp("500 MB", { min: "100 MB", max: "1 GB", format: true }); // "500 MiB"
```

### ⚡ Partial Application

Create pre-configured formatters.

```typescript
import { partial } from "hsize";

// Create a storage formatter
const formatStorage = partial({ system: "si", decimals: 1 });
formatStorage(1500000000); // "1.5 GB"
formatStorage(2500000); // "2.5 MB"

// Create a memory formatter
const formatMemory = partial({ system: "iec", decimals: 2 });
formatMemory(1073741824); // "1 GiB"

// Override options per-call
formatStorage(1000, { decimals: 3 }); // "1 kB"

// Use with map
[1024, 1048576, 1073741824].map(partial({ system: "iec" }));
// ["1 KiB", "1 MiB", "1 GiB"]
```

### 🎛️ Presets

Built-in presets for common use cases.

```typescript
import {
  presets,
  formatStorage,
  formatMemory,
  formatNetwork,
  formatCompact,
  formatPrecise,
  formatFile,
} from "hsize";

// Use preset helper functions
formatStorage(1500000000); // "1.5 GB" (SI, 1 decimal)
formatMemory(1073741824); // "1 GiB" (IEC, 2 decimals)
formatNetwork(125000000); // "1 Gb" (bits, SI)
formatCompact(1536); // "2KiB" (no space, 0 decimals)
formatPrecise(1536); // "1.5000 KiB" (4 decimals, padded)
formatFile(1536); // "1.5 KiB" (IEC, 2 decimals)

// Or use presets directly with format()
import { format } from "hsize";
format(1500000000, presets.storage); // "1.5 GB"
format(1073741824, presets.memory); // "1 GiB"
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
  .toString(); // "1.38 MiB"

// Add/subtract arrays
unit("1 GiB").add(["100 MiB", "200 MiB"]);
unit("1 GiB").subtract(["100 MiB", "200 MiB"]);

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

// Create SI-configured instance
const marketing = create({ system: "si" });
marketing.format(1000000000); // "1 GB"
marketing.parse("1 GB"); // 1073741824

// Create localized instance
const german = create({ locale: "de-DE", decimals: 2 });
german.format(1536); // "1,50 KiB"

// Instance has all methods
const instance = create({ system: "iec" });
instance.format(1024); // format
instance.parse("1 KiB"); // parse
instance.extract("1 KiB file"); // extract
instance.unit("1 KiB"); // unit
```

#### 🛠️ Custom Unit Tables

Define your own unit systems.

```typescript
import { create } from "hsize";

const custom = create({
  customUnits: {
    base: 1024,
    units: [
      { symbol: "ch", name: "chunk", nameP: "chunks" },
      { symbol: "bl", name: "block", nameP: "blocks" },
      { symbol: "sc", name: "sector", nameP: "sectors" },
      { symbol: "rg", name: "region", nameP: "regions" },
    ],
  },
});

custom.format(1); // "1 ch"
custom.format(1024); // "1 bl"
custom.format(1048576); // "1 sc"
custom.format(1073741824); // "1 rg"

custom.format(1048576, { longForm: true }); // "1 sector"
custom.format(2097152, { longForm: true }); // "2 sectors"

custom.parse("2 blocks"); // 2048
custom.parse("1.5 sc"); // 1572864
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

### ✅ Validation Helpers

Validate byte strings before parsing.

```typescript
import { isBytes, isUnit, isParsable } from "hsize";

// Check if a string is a valid byte string
isBytes("1 KB"); // true
isBytes("1.5 GiB"); // true
isBytes("100"); // true (plain numbers are valid)
isBytes("hello"); // false

// Check if a string is a valid unit
isUnit("KB"); // true
isUnit("MiB"); // true
isUnit("xyz"); // false

// Check if any value is parsable
isParsable("1 KB"); // true
isParsable(1024); // true
isParsable(1024n); // true
isParsable("hello"); // false
```

## 💻 CLI

hsize includes a command-line interface.

```bash
# Format bytes to human-readable
hsize 1073741824
# Output: 1 GiB

# Parse human-readable to bytes
hsize "1.5 GB" --to-bytes
# Output: 1610612736

# Use different unit system
hsize 1000000000 --system si
# Output: 1 GB

# Format with options
hsize 1536 --decimals 3 --system iec
# Output: 1.5 KiB

# Compare values
hsize compare "1 GB" "500 MB"
# Output: 1 GiB > 500 MiB

# Extract from stdin
echo "Downloaded 1.5GB of 4GB" | hsize --extract
# Output:
# 1.5 GiB
# 4 GiB

# Show help
hsize --help
```

### CLI Options

| Option           | Description                    |
| ---------------- | ------------------------------ |
| `-b, --to-bytes` | Output raw bytes               |
| `-s, --system`   | Unit system: si, iec, jedec    |
| `-d, --decimals` | Number of decimal places       |
| `-e, --extract`  | Extract byte values from stdin |
| `--bits`         | Format as bits                 |
| `-h, --help`     | Show help                      |
| `-v, --version`  | Show version                   |

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

// Use in calculations
const huge = unit(1099511627776n);
huge.multiply(1000).toString(); // "1000 TiB"

// Strict mode throws for precision loss
const unsafe = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
parse(unsafe, { strict: true }); // throws RangeError
parse(unsafe); // warns and returns approximate value
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
import { format, parse, percent, remaining } from "hsize";

const totalSize = "1 GiB";
const downloaded = "750 MiB";

console.log(`Downloaded: ${format(parse(downloaded))}`);
console.log(`Remaining: ${remaining(downloaded, totalSize, { format: true })}`);
console.log(`Progress: ${percent(downloaded, totalSize)}%`);
```

### Storage Calculator

```typescript
import { sum, average, format } from "hsize";

// Calculate total from multiple files
const files = ["10 MiB", "25 MiB", "100 MiB", "5 MiB"];
console.log(`Total: ${sum(files, { format: true })}`); // "140 MiB"
console.log(`Average: ${average(files, { format: true })}`); // "35 MiB"
```

### Network Bandwidth

```typescript
import { formatRate } from "hsize";

// Display bandwidth in bits (SI)
const bytesPerSec = 12500000;
console.log(`Speed: ${formatRate(bytesPerSec, { bits: true, system: "si" })}`);
// "100 Mb/s"
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
  RateOptions,
  ParsedRate,
  DiffOptions,
  RangeOptions,
  ClampOptions,
  AggregateOptions,
  ApproximateOptions,
  PercentageOptions,
  CustomUnitsConfig,
  PresetName,
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
```

## 📜 License

MIT © [Dobroslav Radosavljevic](https://github.com/dobroslavradosavljevic)

---

_Made with ❤️ for developers who need human-readable bytes_
