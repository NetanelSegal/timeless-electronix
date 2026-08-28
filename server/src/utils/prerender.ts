import fs from "node:fs";
import path from "node:path";
import { isValidSeoSlug } from "./seoSlug.js";

/**
 * Written only after the full slug set has been emitted. The .htaccess 404
 * rule is conditional on this file: when a deploy cannot reach the database
 * the marker is absent and Apache keeps serving the SPA shell, so a failed
 * prerender degrades to the old behaviour instead of 404-ing every part.
 */
export const PRERENDER_MARKER = ".prerendered";

export interface PrerenderResult {
  written: number;
  /** Slugs rejected as unsafe filenames; see the guard in prerenderProductShells. */
  skipped: number;
}

/**
 * Hard link so 18k shells cost one inode's worth of data. Falls back to a copy
 * where links are unavailable (cross-device, restricted shared hosts).
 */
function linkOrCopy(source: string, target: string): void {
  fs.rmSync(target, { force: true });
  try {
    fs.linkSync(source, target);
  } catch {
    fs.copyFileSync(source, target);
  }
}

/**
 * One static file per existing product slug, so Apache can answer
 * /catalog/<slug> from disk: a hit is a real 200, a miss is a real 404 rather
 * than the SPA shell under 200 — which is what Google logs as a soft 404.
 *
 * `outDir` must sit outside the /catalog URL namespace (see the caller): a
 * real "catalog" directory in the web root makes mod_dir redirect /catalog to
 * /catalog/, which the trailing-slash rule strips straight back.
 *
 * Every file is a byte-for-byte copy of the built shell. Nothing is injected,
 * so no product field reaches the HTML and there is no escaping to get wrong;
 * React still fetches and renders the product client-side exactly as before.
 */
export async function prerenderProductShells(options: {
  outDir: string;
  shellPath: string;
  slugs: AsyncIterable<string> | Iterable<string>;
}): Promise<PrerenderResult> {
  const { outDir, shellPath, slugs } = options;
  if (!fs.existsSync(shellPath)) {
    throw new Error(`prerender: shell not found at ${shellPath}; run the client build first`);
  }
  const resolvedDir = path.resolve(outDir);
  fs.mkdirSync(resolvedDir, { recursive: true });

  let written = 0;
  let skipped = 0;

  for await (const raw of slugs) {
    const slug = String(raw ?? "").trim();
    // The slug becomes a filename, so it is validated rather than sanitised:
    // a legacy or CSV-imported row containing "../" must never be able to
    // write outside the output directory. isValidSeoSlug is the same
    // constraint the admin API enforces on write.
    if (!isValidSeoSlug(slug)) {
      skipped += 1;
      continue;
    }
    const target = path.resolve(resolvedDir, `${slug}.html`);
    // Belt and braces: even if the charset guard above ever loosens, refuse
    // anything that resolves outside the output directory.
    if (path.dirname(target) !== resolvedDir) {
      skipped += 1;
      continue;
    }
    linkOrCopy(shellPath, target);
    written += 1;
  }

  fs.writeFileSync(
    path.join(resolvedDir, PRERENDER_MARKER),
    `${new Date().toISOString()}\n${written}\n`,
    "utf8",
  );

  return { written, skipped };
}
