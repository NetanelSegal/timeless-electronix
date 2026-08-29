import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MAX_PRERENDER_SLUG_LENGTH,
  PRERENDER_MARKER,
  isPrerenderableSlug,
  prerenderProductShells,
} from "../utils/prerender.js";

let tmp: string;
let shellPath: string;
let outDir: string;

const SHELL = "<!doctype html><html><body><div id=\"root\"></div></body></html>";

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prerender-"));
  shellPath = path.join(tmp, "index.html");
  outDir = path.join(tmp, "catalog");
  fs.writeFileSync(shellPath, SHELL, "utf8");
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("prerenderProductShells", () => {
  it("writes one shell per valid slug", async () => {
    const res = await prerenderProductShells({
      outDir,
      shellPath,
      slugs: ["abc-123", "3m-3341-1s-nb889-20"],
    });

    expect(res).toEqual({ written: 2, skipped: 0 });
    expect(fs.readFileSync(path.join(outDir, "abc-123.html"), "utf8")).toBe(SHELL);
    expect(
      fs.readFileSync(path.join(outDir, "3m-3341-1s-nb889-20.html"), "utf8"),
    ).toBe(SHELL);
  });

  it("writes the marker only after the whole set is emitted", async () => {
    await prerenderProductShells({ outDir, shellPath, slugs: ["abc-123"] });
    expect(fs.existsSync(path.join(outDir, PRERENDER_MARKER))).toBe(true);
  });

  it("refuses slugs that would escape the catalog directory", async () => {
    const res = await prerenderProductShells({
      outDir,
      shellPath,
      // A legacy or CSV-imported row is not covered by the admin zod schema.
      slugs: ["../../evil", "../escape", "/abs", "ok-1"],
    });

    expect(res.written).toBe(1);
    expect(res.skipped).toBe(3);
    expect(fs.existsSync(path.join(tmp, "evil.html"))).toBe(false);
    expect(fs.existsSync(path.join(tmp, "escape.html"))).toBe(false);
    expect(fs.readdirSync(outDir).sort()).toEqual([
      PRERENDER_MARKER,
      "ok-1.html",
    ]);
  });

  it("refuses slugs outside the slug charset", async () => {
    const res = await prerenderProductShells({
      outDir,
      shellPath,
      slugs: ["UPPER", "has space", "semi;colon", "dot.dot", "", "  "],
    });

    expect(res.written).toBe(0);
    expect(res.skipped).toBe(6);
    expect(fs.readdirSync(outDir)).toEqual([PRERENDER_MARKER]);
  });

  // Regression: these are untidy but perfectly safe filenames. Guarding with
  // isValidSeoSlug (which forbids them as a URL-shape policy) skipped 521 real
  // products while the .htaccess rule still matched them on charset, so they
  // were answered with a hard 404 despite existing. The two must accept the
  // same set.
  it("writes shells for untidy but safe legacy slugs", async () => {
    const res = await prerenderProductShells({
      outDir,
      shellPath,
      slugs: [
        "ad-adsp-2183kca-210-nb372-13-356-", // trailing hyphen
        "ad-ad712jr--1ur-183", // doubled hyphen
        "-leading-hyphen",
      ],
    });

    expect(res).toEqual({ written: 3, skipped: 0 });
    expect(
      fs.existsSync(path.join(outDir, "ad-adsp-2183kca-210-nb372-13-356-.html")),
    ).toBe(true);
    expect(fs.existsSync(path.join(outDir, "ad-ad712jr--1ur-183.html"))).toBe(true);
  });

  it("rejects slugs longer than the .htaccess bound", async () => {
    const res = await prerenderProductShells({
      outDir,
      shellPath,
      slugs: ["a".repeat(MAX_PRERENDER_SLUG_LENGTH + 1)],
    });

    expect(res).toEqual({ written: 0, skipped: 1 });
  });

  describe("isPrerenderableSlug matches the .htaccess pattern", () => {
    // The rule is ^catalog/([a-z0-9-]{1,120})$ — keep these in lockstep.
    it.each([
      ["abc-123", true],
      ["trailing-", true],
      ["-leading", true],
      ["double--hyphen", true],
      ["a".repeat(120), true],
      ["a".repeat(121), false],
      ["", false],
      ["Upper", false],
      ["has space", false],
      ["dot.dot", false],
      ["../escape", false],
      ["with/slash", false],
    ])("%s -> %s", (slug, expected) => {
      expect(isPrerenderableSlug(slug)).toBe(expected);
    });
  });

  it("fails loudly when the client build has not run", async () => {
    await expect(
      prerenderProductShells({
        outDir,
        shellPath: path.join(tmp, "missing.html"),
        slugs: ["abc-123"],
      }),
    ).rejects.toThrow(/shell not found/);
  });

  it("replaces shells left by a previous build", async () => {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "abc-123.html"), "STALE", "utf8");

    await prerenderProductShells({ outDir, shellPath, slugs: ["abc-123"] });

    expect(fs.readFileSync(path.join(outDir, "abc-123.html"), "utf8")).toBe(SHELL);
  });
});
