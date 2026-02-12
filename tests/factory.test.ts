import { describe, expect, it } from "bun:test";

import { create } from "../src/index";

describe("create (factory)", () => {
  it("creates configured instance", () => {
    const siBytes = create({ system: "si" });
    expect(siBytes.format(1000)).toBe("1 kB");
  });

  it("merges options", () => {
    const configured = create({ system: "si" });
    expect(configured.format(1536, { decimals: 1 })).toBe("1.5 kB");
  });

  it("has all methods", () => {
    const instance = create();
    expect(typeof instance.format).toBe("function");
    expect(typeof instance.parse).toBe("function");
    expect(typeof instance.extract).toBe("function");
    expect(typeof instance.unit).toBe("function");
    expect(typeof instance.create).toBe("function");
  });

  it("can be called directly", () => {
    const instance = create({ system: "si" });
    expect(instance(1000)).toBe("1 kB");
    expect(instance("1 kB")).toBe(1000);
  });

  it("creates nested instances", () => {
    const base = create({ system: "si" });
    const nested = base.create({ decimals: 3 });
    expect(typeof nested.format).toBe("function");
  });

  it("preserves config for parse", () => {
    const instance = create({ strict: true });
    expect(() => instance.parse("invalid")).toThrow();
  });

  it("creates unit from instance", () => {
    const instance = create({ system: "si" });
    const unit = instance.unit("1 KiB");
    expect(unit.bytes).toBe(1024);
    expect(unit.toString()).toBe("1 KiB");
  });

  it("uses extract from instance", () => {
    const instance = create();
    const results = instance.extract("File size: 1.5 MB");
    expect(results.length).toBe(1);
    expect(results[0].bytes).toBe(1_572_864);
  });

  it("preserves locale config for parse", () => {
    const instance = create({ locale: "de-DE" });
    expect(instance.parse("1,5 KiB")).toBe(1536);
  });

  it("throws for out-of-safe-range BigInt parse input", () => {
    const instance = create();
    expect(() => instance.parse(2n ** 80n)).toThrow(RangeError);
  });
});
