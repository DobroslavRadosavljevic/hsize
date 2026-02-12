# Changelog

## Unreleased

### Fixed

- Corrected `parseRate()` parsing for slash-style bit units. Lowercase `b` units
  like `"Mb/s"` and `"Kib/s"` are now interpreted as bits, while uppercase `B`
  units like `"MB/s"` remain bytes.
- Hardened BigInt safety in number-based helper APIs. Out-of-safe-range BigInt
  inputs now throw `RangeError` in:
  `compare`, `diff`, `percent`/`percentOf`/`remaining`, `sum`/`average`/`median`,
  `clamp`, `formatRange`, `approximate`, and `create().parse`.
- Fixed overflow handling in `parse()` for scientific-notation strings.
  Values that overflow finite number range now return `NaN`, and strict mode
  (`{ strict: true }`) throws `TypeError`.
