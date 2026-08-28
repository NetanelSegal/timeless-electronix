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
export const catalogDir = path.join(clientDist, "catalog");

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
    catalogDir,
    shellPath,
    slugs: productSlugs(),
  });
  console.log(`prerender: wrote ${written} product shells to ${catalogDir}`);
  if (skipped > 0) {
    console.warn(`prerender: skipped ${skipped} row(s) with an unsafe seoSlug`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
