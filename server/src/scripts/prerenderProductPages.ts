import path from "node:path";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { Product } from "../models/Product.js";
import { prerenderProductShells } from "../utils/prerender.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

/**
 * Runs AFTER `vite build`: it writes into client/dist, which the client build
 * empties. Running it before would have the shells wiped out.
 */
const clientDist = path.join(repoRoot, "client", "dist");
export const shellPath = path.join(clientDist, "index.html");
/**
 * Deliberately NOT client/dist/catalog: that directory name collides with the
 * /catalog SPA route. A real directory there makes mod_dir 301 /catalog to
 * /catalog/, which the trailing-slash rule strips straight back — an infinite
 * redirect on the catalog page — and makes the rewrite target re-match the
 * product rule on the next pass. _parts is not a route, so neither happens.
 */
export const outDir = path.join(clientDist, "_parts");

async function* productSlugs(): AsyncGenerator<string> {
  const cursor = Product.find(
    { seoSlug: { $nin: [null, ""] } },
    { seoSlug: 1 },
  )
    .lean()
    .cursor();
  for await (const doc of cursor) {
    yield String(doc.seoSlug ?? "");
  }
}

async function main() {
  console.log("prerender: connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  const { written, skipped } = await prerenderProductShells({
    outDir,
    shellPath,
    slugs: productSlugs(),
  });
  console.log(`prerender: wrote ${written} product shells to ${outDir}`);
  if (skipped > 0) {
    console.warn(`prerender: skipped ${skipped} row(s) with an unsafe seoSlug`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
