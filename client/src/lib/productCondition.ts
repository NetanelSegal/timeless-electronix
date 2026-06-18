export const PRODUCT_CONDITIONS = [
  "New/Standard",
  "Used",
  "Refurbished",
  "Broken",
] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export function conditionBadgeClass(condition: ProductCondition): string {
  switch (condition) {
    case "New/Standard":
      return "bg-green-brand/15 text-green-brand";
    case "Used":
      return "bg-amber-500/15 text-amber-400";
    case "Refurbished":
      return "bg-sky-500/15 text-sky-400";
    case "Broken":
      return "bg-red-500/15 text-red-400";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
