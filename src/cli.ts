#!/usr/bin/env node

/**
 * hsize CLI - Convert between bytes and human-readable formats
 *
 * Usage:
 *   hsize <bytes>              Format bytes to human-readable
 *   hsize "<size>" --to-bytes  Parse human-readable to bytes
 *   hsize compare "<a>" "<b>"  Compare two byte values
 *   echo "text" | hsize -e     Extract byte values from stdin
 *
 * Options:
 *   -b, --to-bytes    Output raw bytes instead of human-readable
 *   -s, --system      Unit system: si, iec, jedec (default: iec)
 *   -d, --decimals    Number of decimal places (default: 2)
 *   -e, --extract     Extract mode - extract byte values from stdin
 *   --bits            Format output as bits instead of bytes
 *   -h, --help        Show this help message
 *   -v, --version     Show version number
 *
 * Examples:
 *   hsize 1073741824               # Output: 1 GiB
 *   hsize "1.5 GB" -b              # Output: 1500000000
 *   hsize 1000000000 -s si         # Output: 1 GB
 *   hsize 1536 -d 3 -s iec         # Output: 1.5 KiB
 *   hsize compare "1 GB" "500 MB"  # Output: 1 GB > 500 MB
 *   echo "File: 1.5GB" | hsize -e  # Output: 1.5 GB
 */

import type { FormatOptions, UnitSystem } from "./types";

import { gt, lt } from "./compare";
import { extract } from "./extract";
import { format } from "./format";
import { parse } from "./parse";

const VERSION = "1.0.0";

interface ParsedArgs {
  args: string[];
  bits: boolean;
  command: string | null;
  decimals: number;
  extractMode: boolean;
  help: boolean;
  system: UnitSystem;
  toBytes: boolean;
  version: boolean;
}

type ArgHandler = (
  result: ParsedArgs,
  args: string[],
  index: number
) => number | undefined;

const FLAG_MAP: Record<string, keyof ParsedArgs> = {
  "--bits": "bits",
  "--extract": "extractMode",
  "--help": "help",
  "--to-bytes": "toBytes",
  "--version": "version",
  "-b": "toBytes",
  "-e": "extractMode",
  "-h": "help",
  "-v": "version",
};

const SHORT_FLAG_MAP: Record<string, keyof ParsedArgs> = {
  b: "toBytes",
  e: "extractMode",
  h: "help",
  v: "version",
};

const isValidSystem = (value: string): value is UnitSystem =>
  value === "si" || value === "iec" || value === "jedec";

const handleSystemArg: ArgHandler = (result, args, index) => {
  const nextIndex = index + 1;
  const systemValue = args[nextIndex];

  if (!isValidSystem(systemValue)) {
    console.error(`Invalid system: ${systemValue}. Use si, iec, or jedec.`);
    process.exit(1);
  }

  result.system = systemValue;
  return nextIndex;
};

const handleDecimalsArg: ArgHandler = (result, args, index) => {
  const nextIndex = index + 1;
  const decimalsValue = Number.parseInt(args[nextIndex], 10);

  if (Number.isNaN(decimalsValue) || decimalsValue < 0) {
    console.error("Decimals must be a non-negative integer.");
    process.exit(1);
  }

  result.decimals = decimalsValue;
  return nextIndex;
};

const handleBooleanFlag = (result: ParsedArgs, arg: string): boolean => {
  const key = FLAG_MAP[arg];

  if (key) {
    (result[key] as boolean) = true;
    return true;
  }

  return false;
};

const handleCombinedShortFlags = (result: ParsedArgs, arg: string): boolean => {
  if (!arg.startsWith("-") || arg.startsWith("--")) {
    return false;
  }

  const flags = arg.slice(1);

  for (const flag of flags) {
    const key = SHORT_FLAG_MAP[flag];

    if (key) {
      (result[key] as boolean) = true;
    }
  }

  return true;
};

const handlePositionalArg = (result: ParsedArgs, arg: string): void => {
  if (result.command === null && arg === "compare") {
    result.command = "compare";
  } else {
    result.args.push(arg);
  }
};

const createDefaultArgs = (): ParsedArgs => ({
  args: [],
  bits: false,
  command: null,
  decimals: 2,
  extractMode: false,
  help: false,
  system: "iec",
  toBytes: false,
  version: false,
});

const parseArgs = (argv: string[]): ParsedArgs => {
  const result = createDefaultArgs();
  const cliArgs = argv.slice(2);

  let i = 0;

  while (i < cliArgs.length) {
    const arg = cliArgs[i];
    let newIndex: number | undefined;

    if (arg === "-s" || arg === "--system") {
      newIndex = handleSystemArg(result, cliArgs, i);
    } else if (arg === "-d" || arg === "--decimals") {
      newIndex = handleDecimalsArg(result, cliArgs, i);
    } else if (
      !handleBooleanFlag(result, arg) &&
      !handleCombinedShortFlags(result, arg)
    ) {
      handlePositionalArg(result, arg);
    }

    i = typeof newIndex === "number" ? newIndex + 1 : i + 1;
  }

  return result;
};

const HELP_TEXT = `hsize - Convert between bytes and human-readable formats

Usage:
  hsize <bytes>              Format bytes to human-readable
  hsize "<size>" --to-bytes  Parse human-readable to bytes
  hsize compare "<a>" "<b>"  Compare two byte values
  echo "text" | hsize -e     Extract byte values from stdin

Options:
  -b, --to-bytes    Output raw bytes instead of human-readable
  -s, --system      Unit system: si, iec, jedec (default: iec)
  -d, --decimals    Number of decimal places (default: 2)
  -e, --extract     Extract mode - extract byte values from stdin
  --bits            Format output as bits instead of bytes
  -h, --help        Show this help message
  -v, --version     Show version number

Examples:
  hsize 1073741824               # Output: 1 GiB
  hsize "1.5 GB" -b              # Output: 1500000000
  hsize 1000000000 -s si         # Output: 1 GB
  hsize 1536 -d 3 -s iec         # Output: 1.5 KiB
  hsize compare "1 GB" "500 MB"  # Output: 1 GB > 500 MB
  echo "File: 1.5GB" | hsize -e  # Output: 1.5 GB
`;

const showHelp = (): void => {
  console.log(HELP_TEXT);
};

const showVersion = (): void => {
  console.log(`hsize v${VERSION}`);
};

const readStdin = async (): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
};

const getComparisonSymbol = (bytesA: number, bytesB: number): string => {
  if (gt(bytesA, bytesB)) {
    return ">";
  }

  if (lt(bytesA, bytesB)) {
    return "<";
  }

  return "=";
};

const handleCompare = (args: string[], options: FormatOptions): void => {
  if (args.length < 2) {
    console.error("Compare requires two values: hsize compare <a> <b>");
    process.exit(1);
  }

  const [a, b] = args;
  const bytesA = parse(a);
  const bytesB = parse(b);

  if (Number.isNaN(bytesA) || Number.isNaN(bytesB)) {
    console.error("Invalid byte values provided.");
    process.exit(1);
  }

  const formattedA = format(bytesA, options);
  const formattedB = format(bytesB, options);
  const comparison = getComparisonSymbol(bytesA, bytesB);

  console.log(`${formattedA} ${comparison} ${formattedB}`);
};

const handleExtract = async (options: FormatOptions): Promise<void> => {
  const input = await readStdin();
  const extracted = extract(input);

  if (extracted.length === 0) {
    console.error("No byte values found in input.");
    process.exit(1);
  }

  for (const item of extracted) {
    console.log(format(item.bytes, options));
  }
};

const formatNumericInput = (input: string, options: FormatOptions): void => {
  const numericValue = Number(input);

  if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
    console.log(format(numericValue, options));
    return;
  }

  const bytes = parse(input);

  if (Number.isNaN(bytes)) {
    console.error(`Invalid input: ${input}`);
    process.exit(1);
  }

  console.log(format(bytes, options));
};

const handleToBytes = (input: string): void => {
  const bytes = parse(input);

  if (Number.isNaN(bytes)) {
    console.error(`Invalid byte string: ${input}`);
    process.exit(1);
  }

  console.log(bytes);
};

const handleDefault = (
  args: string[],
  toBytes: boolean,
  options: FormatOptions
): void => {
  if (args.length === 0) {
    console.error("No value provided. Use --help for usage.");
    process.exit(1);
  }

  const input = args.join(" ");

  if (toBytes) {
    handleToBytes(input);
    return;
  }

  formatNumericInput(input, options);
};

const createOptions = (parsed: ParsedArgs): FormatOptions => ({
  bits: parsed.bits,
  decimals: parsed.decimals,
  system: parsed.system,
});

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv);

  if (parsed.help) {
    showHelp();
    return;
  }

  if (parsed.version) {
    showVersion();
    return;
  }

  const options = createOptions(parsed);

  if (parsed.extractMode) {
    await handleExtract(options);
    return;
  }

  if (parsed.command === "compare") {
    handleCompare(parsed.args, options);
    return;
  }

  handleDefault(parsed.args, parsed.toBytes, options);
};

const run = async (): Promise<void> => {
  try {
    await main();
  } catch (error: unknown) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

run();
