import { describe, it, expect } from "vitest";
import { effectiveListSort, parsePageFromSearchParams } from "./listUrlQuery";

const catalogLike = {
  allowedFields: ["quantity", "partNumber", "manufacturer", "updatedAt"] as const,
  defaultField: "quantity",
  fieldDefaultOrder: {
    quantity: "desc" as const,
    partNumber: "asc" as const,
    manufacturer: "asc" as const,
    updatedAt: "desc" as const,
  },
};

describe("effectiveListSort", () => {
  it("uses default field when sort missing or not allowlisted", () => {
    const empty = new URLSearchParams();
    expect(effectiveListSort(empty, catalogLike)).toEqual({
      field: "quantity",
      order: "desc",
      presetValue: "quantity:desc",
    });

    const unknown = new URLSearchParams("sort=hack&order=asc");
    expect(effectiveListSort(unknown, catalogLike).field).toBe("quantity");
  });

  it("uses allowlisted sort with explicit asc/desc", () => {
    const p = new URLSearchParams("sort=partNumber&order=desc");
    expect(effectiveListSort(p, catalogLike)).toEqual({
      field: "partNumber",
      order: "desc",
      presetValue: "partNumber:desc",
    });
  });

  it("uses field default order when order missing or invalid", () => {
    const noOrder = new URLSearchParams("sort=partNumber");
    expect(effectiveListSort(noOrder, catalogLike).order).toBe("asc");

    const badOrder = new URLSearchParams("sort=updatedAt&order=zig");
    expect(effectiveListSort(badOrder, catalogLike).order).toBe("desc");
  });

  it("normalizes order to lowercase", () => {
    const p = new URLSearchParams("sort=manufacturer&order=DESC");
    expect(effectiveListSort(p, catalogLike).order).toBe("desc");
  });

  it("trims sort param", () => {
    const p = new URLSearchParams("sort=%20partNumber%20&order=asc");
    expect(effectiveListSort(p, catalogLike).field).toBe("partNumber");
  });

  it("falls back to desc when field has no entry in fieldDefaultOrder", () => {
    const cfg = {
      allowedFields: ["a", "b"] as const,
      defaultField: "a",
      fieldDefaultOrder: {} as Record<string, "asc" | "desc">,
    };
    const p = new URLSearchParams("sort=b&order=nope");
    expect(effectiveListSort(p, cfg)).toEqual({
      field: "b",
      order: "desc",
      presetValue: "b:desc",
    });
  });
});

describe("parsePageFromSearchParams", () => {
  it("returns valid positive pages", () => {
    expect(parsePageFromSearchParams(new URLSearchParams("page=1"))).toBe(1);
    expect(parsePageFromSearchParams(new URLSearchParams("page=42"))).toBe(42);
  });

  it("returns fallback for missing, invalid, zero, or negative", () => {
    expect(parsePageFromSearchParams(new URLSearchParams())).toBe(1);
    expect(parsePageFromSearchParams(new URLSearchParams("page="))).toBe(1);
    expect(parsePageFromSearchParams(new URLSearchParams("page=abc"))).toBe(1);
    expect(parsePageFromSearchParams(new URLSearchParams("page=0"))).toBe(1);
    expect(parsePageFromSearchParams(new URLSearchParams("page=-3"))).toBe(1);
  });

  it("respects custom fallback", () => {
    expect(
      parsePageFromSearchParams(new URLSearchParams("page=bad"), 5),
    ).toBe(5);
  });
});
