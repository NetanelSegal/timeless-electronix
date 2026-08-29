/**
 * The same brand is spelled several ways in the imported data — ABRACON and
 * Abracon, LITTELFUSE and Littelfuse. 594 of the 2,000 distinct manufacturer
 * strings are casing variants of another (292 groups), which is why an exact
 * `{ manufacturer }` filter silently misses rows.
 */
export function normalizeManufacturer(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Display spelling for a group of variants: the most common one, ties broken
 * lexicographically so the choice is stable across requests and deploys.
 */
export function pickManufacturerDisplay(variants: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const raw of variants) {
    const v = raw.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = "";
  let bestCount = -1;
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && value < best)) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/** Distinct display names across raw variants, sorted for stable output. */
export function distinctManufacturerNames(raw: readonly string[]): string[] {
  const byKey = new Map<string, string[]>();
  for (const name of raw) {
    const value = name.trim();
    if (!value) continue;
    const key = normalizeManufacturer(value);
    const list = byKey.get(key);
    if (list) list.push(value);
    else byKey.set(key, [value]);
  }
  return [...byKey.values()]
    .map(pickManufacturerDisplay)
    .sort((a, b) => a.localeCompare(b));
}
