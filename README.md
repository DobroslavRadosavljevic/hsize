# hsize

Convert bytes to human-readable strings and vice versa.

## Install

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

## Usage

```ts
import { format, parse } from "hsize";

format(1024);
// => "1 KB"

parse("1 KB");
// => 1024
```

## API

### format(bytes)

Convert bytes to a human-readable string.

- `bytes` - Number of bytes

Returns a human-readable string.

### parse(str)

Parse a human-readable string to bytes.

- `str` - Human-readable string (e.g., "1 KB", "5 MB")

Returns the number of bytes.

## License

MIT
