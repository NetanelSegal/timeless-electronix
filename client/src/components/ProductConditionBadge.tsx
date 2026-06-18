import {
  conditionBadgeClass,
  type ProductCondition,
} from "../lib/productCondition";

interface Props {
  condition: ProductCondition;
  /** Light card style (catalog grid) vs dark detail page */
  variant?: "card" | "detail";
  className?: string;
}

export default function ProductConditionBadge({
  condition,
  variant = "card",
  className = "",
}: Props) {
  const base =
    variant === "detail"
      ? `inline-flex items-center rounded-lg border border-border px-3 py-1 text-sm ${conditionBadgeClass(condition)}`
      : `inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${conditionBadgeClass(condition)}`;

  return (
    <span className={`${base} ${className}`.trim()} title="Product condition">
      {condition}
    </span>
  );
}
