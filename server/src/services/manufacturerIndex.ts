import { Product } from "../models/Product.js";
import {
  distinctManufacturerNames,
  normalizeManufacturer,
} from "../utils/manufacturerName.js";

/**
 * The manufacturer strings, grouped case-insensitively. Cached because both
 * the dropdown and every filtered catalog request need it, and it changes only
 * when products are written. A new manufacturer becomes selectable within the
 * TTL rather than instantly — acceptable for a catalog loaded by bulk import.
 */
const TTL_MS = 5 * 60_000;

interface Snapshot {
  at: number;
  /** normalized name -> every raw spelling in the database */
  variantsByKey: Map<string, string[]>;
  displayNames: string[];
}

let snapshot: Snapshot | null = null;

export function clearManufacturerCache(): void {
  snapshot = null;
}

async function load(): Promise<Snapshot> {
  const now = Date.now();
  if (snapshot && now - snapshot.at < TTL_MS) return snapshot;

  const raw = (await Product.distinct("manufacturer", {
    manufacturer: { $nin: [null, ""] },
  })) as string[];

  const variantsByKey = new Map<string, string[]>();
  for (const name of raw) {
    const value = String(name ?? "").trim();
    if (!value) continue;
    const key = normalizeManufacturer(value);
    const list = variantsByKey.get(key);
    if (list) list.push(value);
    else variantsByKey.set(key, [value]);
  }

  snapshot = {
    at: now,
    variantsByKey,
    displayNames: distinctManufacturerNames(raw.map((r) => String(r ?? ""))),
  };
  return snapshot;
}

/** Deduplicated names for the filter dropdown. */
export async function listManufacturerDisplayNames(): Promise<string[]> {
  return (await load()).displayNames;
}

/**
 * Every raw spelling of `name`, so a filter can match them all with an
 * index-backed `$in` instead of a case-insensitive regex, which would scan the
 * collection on the catalog's main browse path. Returns [] when unknown, which
 * the caller turns into an exact match that correctly finds nothing.
 */
export async function getManufacturerVariants(name: string): Promise<string[]> {
  const key = normalizeManufacturer(name);
  if (!key) return [];
  return (await load()).variantsByKey.get(key) ?? [];
}
