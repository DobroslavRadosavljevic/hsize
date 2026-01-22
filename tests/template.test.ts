import { describe, expect, it } from "bun:test";

import { format } from "../src/index";

describe("template basic placeholders", () => {
  it("formats with {value}{unit} template (no space)", () => {
    expect(format(1536, { template: "{value}{unit}" })).toBe("1.5KiB");
  });

  it("formats with {value} {unit} template (with space)", () => {
    expect(format(1536, { template: "{value} {unit}" })).toBe("1.5 KiB");
  });

  it("formats with {value} {longUnit} template", () => {
    expect(format(1536, { template: "{value} {longUnit}" })).toBe(
      "1.5 kibibytes"
    );
  });

  it("formats with {bytes} placeholder", () => {
    expect(format(1536, { template: "{bytes} bytes = {value} {unit}" })).toBe(
      "1536 bytes = 1.5 KiB"
    );
  });

  it("formats with {exponent} placeholder", () => {
    expect(format(1536, { template: "{value}|{unit}|{exponent}" })).toBe(
      "1.5|KiB|1"
    );
  });

  it("formats with all placeholders", () => {
    expect(
      format(1536, {
        template:
          "Value: {value}, Unit: {unit}, Long: {longUnit}, Bytes: {bytes}, Exp: {exponent}",
      })
    ).toBe("Value: 1.5, Unit: KiB, Long: kibibytes, Bytes: 1536, Exp: 1");
  });
});

describe("template with different unit systems", () => {
  it("formats SI units with template", () => {
    expect(format(1500, { system: "si", template: "{value}{unit}" })).toBe(
      "1.5kB"
    );
  });

  it("formats JEDEC units with template", () => {
    expect(format(1536, { system: "jedec", template: "{value}{unit}" })).toBe(
      "1.5KB"
    );
  });

  it("formats IEC long unit with SI system", () => {
    expect(format(1500, { system: "si", template: "{value} {longUnit}" })).toBe(
      "1.5 kilobytes"
    );
  });

  it("formats JEDEC long unit", () => {
    expect(
      format(1536, { system: "jedec", template: "{value} {longUnit}" })
    ).toBe("1.5 kilobytes");
  });
});

describe("template with singular/plural long units", () => {
  it("uses singular for exactly 1", () => {
    expect(format(1024, { template: "{value} {longUnit}" })).toBe("1 kibibyte");
  });

  it("uses plural for values greater than 1", () => {
    expect(format(2048, { template: "{value} {longUnit}" })).toBe(
      "2 kibibytes"
    );
  });

  it("uses plural for fractional values", () => {
    expect(format(1536, { template: "{value} {longUnit}" })).toBe(
      "1.5 kibibytes"
    );
  });

  it("uses plural for 0", () => {
    expect(format(0, { template: "{value} {longUnit}" })).toBe("0 bytes");
  });

  it("uses singular for 1 byte", () => {
    expect(format(1, { template: "{value} {longUnit}" })).toBe("1 byte");
  });
});

describe("template with decimals option", () => {
  it("formats with 0 decimals", () => {
    expect(format(1536, { decimals: 0, template: "{value} {unit}" })).toBe(
      "2 KiB"
    );
  });

  it("formats with 3 decimals", () => {
    expect(format(1536, { decimals: 3, template: "{value} {unit}" })).toBe(
      "1.5 KiB"
    );
  });

  it("formats with pad option", () => {
    expect(
      format(1024, { decimals: 2, pad: true, template: "{value} {unit}" })
    ).toBe("1.00 KiB");
  });
});

describe("template with signed option", () => {
  it("formats positive value with sign", () => {
    expect(format(1024, { signed: true, template: "{value} {unit}" })).toBe(
      "+1 KiB"
    );
  });

  it("formats negative value", () => {
    expect(format(-1024, { template: "{value} {unit}" })).toBe("-1 KiB");
  });

  it("does not add sign to zero", () => {
    expect(format(0, { signed: true, template: "{value} {unit}" })).toBe("0 B");
  });
});

describe("template with bits option", () => {
  it("formats as bits with template", () => {
    expect(format(1024, { bits: true, template: "{value} {unit}" })).toBe(
      "8 Kib"
    );
  });

  it("formats bits long unit", () => {
    expect(format(1024, { bits: true, template: "{value} {longUnit}" })).toBe(
      "8 kibibits"
    );
  });
});

describe("template with exponent levels", () => {
  it("formats bytes (exponent 0)", () => {
    expect(format(500, { template: "{value} {unit} (exp {exponent})" })).toBe(
      "500 B (exp 0)"
    );
  });

  it("formats KiB (exponent 1)", () => {
    expect(format(1024, { template: "{value} {unit} (exp {exponent})" })).toBe(
      "1 KiB (exp 1)"
    );
  });

  it("formats MiB (exponent 2)", () => {
    expect(
      format(1_048_576, { template: "{value} {unit} (exp {exponent})" })
    ).toBe("1 MiB (exp 2)");
  });

  it("formats GiB (exponent 3)", () => {
    expect(
      format(1_073_741_824, { template: "{value} {unit} (exp {exponent})" })
    ).toBe("1 GiB (exp 3)");
  });
});

describe("template with fixedWidth option", () => {
  it("pads result to fixed width", () => {
    const result = format(1024, {
      fixedWidth: 15,
      template: "{value} {unit}",
    });
    expect(result.length).toBe(15);
    expect(result).toBe("          1 KiB");
  });

  it("does not truncate when result exceeds fixedWidth", () => {
    const result = format(1024, {
      fixedWidth: 3,
      template: "{value} {unit}",
    });
    expect(result).toBe("1 KiB");
  });
});

describe("template with BigInt values", () => {
  it("formats BigInt bytes", () => {
    expect(format(1024n, { template: "{bytes} -> {value} {unit}" })).toBe(
      "1024 -> 1 KiB"
    );
  });

  it("formats large BigInt values", () => {
    expect(format(1_099_511_627_776n, { template: "{value} {unit}" })).toBe(
      "1 TiB"
    );
  });
});

describe("template with locale formatting", () => {
  it("formats value with locale", () => {
    const result = format(1536, {
      locale: "de-DE",
      template: "{value} {unit}",
    });
    expect(result).toContain("1,5");
  });
});

describe("template edge cases", () => {
  it("handles empty template", () => {
    expect(format(1024, { template: "" })).toBe("");
  });

  it("handles template with no placeholders", () => {
    expect(format(1024, { template: "static text" })).toBe("static text");
  });

  it("handles template with duplicate placeholders", () => {
    expect(format(1024, { template: "{unit} - {unit}" })).toBe("KiB - KiB");
  });

  it("handles template with only bytes placeholder", () => {
    expect(format(1024, { template: "{bytes}" })).toBe("1024");
  });

  it("preserves unknown placeholders", () => {
    expect(format(1024, { template: "{value} {unknown}" })).toBe("1 {unknown}");
  });
});

describe("template without template option", () => {
  it("formats normally when template is not provided", () => {
    expect(format(1024)).toBe("1 KiB");
  });

  it("formats normally when template is undefined", () => {
    expect(format(1024, { template: undefined })).toBe("1 KiB");
  });
});

describe("template with forced unit/exponent", () => {
  it("uses forced unit in template", () => {
    expect(format(1_048_576, { template: "{value} {unit}", unit: "KiB" })).toBe(
      "1024 KiB"
    );
  });

  it("uses forced exponent in template", () => {
    expect(format(1_048_576, { exponent: 1, template: "{value} {unit}" })).toBe(
      "1024 KiB"
    );
  });
});
