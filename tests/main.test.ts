import { describe, expect, it } from "bun:test";

import hsize from "../src/index";

describe("hsize (main function)", () => {
  it("formats numbers", () => {
    expect(hsize(1024)).toBe("1 KiB");
  });

  it("parses strings", () => {
    expect(hsize("1 KiB")).toBe(1024);
  });

  it("accepts options", () => {
    expect(hsize(1000, { system: "si" })).toBe("1 kB");
  });

  it("has attached format method", () => {
    expect(hsize.format(1024)).toBe("1 KiB");
  });

  it("has attached parse method", () => {
    expect(hsize.parse("1 KiB")).toBe(1024);
  });

  it("has attached extract method", () => {
    expect(hsize.extract("1 KiB").length).toBe(1);
  });

  it("has attached unit method", () => {
    expect(hsize.unit(1024).bytes).toBe(1024);
  });

  it("has attached create method", () => {
    expect(typeof hsize.create).toBe("function");
  });

  it("works with various input types", () => {
    expect(hsize(0)).toBe("0 B");
    expect(hsize(1024n)).toBe("1 KiB");
    expect(hsize("2 MiB")).toBe(2_097_152);
  });
});
