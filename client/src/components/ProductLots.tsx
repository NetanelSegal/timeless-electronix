import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import type { Product, ProductLot, QuoteItem } from "../lib/types";
import { hasMultipleManufacturers } from "../lib/productGroup";
import ProductConditionBadge from "./ProductConditionBadge";
import { isProductCondition } from "../lib/productCondition";

interface Props {
  product: Product;
  lots: ProductLot[];
  items: QuoteItem[];
  addItem: (item: QuoteItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
}

/**
 * Every stock lot of the part, on the part's own page. Each lot is its own
 * database row with its own quantity, date code and reference, so a customer
 * can ask for 500 from the new lot and 200 from the used one in a single
 * quote — each becomes its own cart line.
 */
export default function ProductLots({
  product,
  lots,
  items,
  addItem,
  updateQuantity,
}: Props) {
  // Kept as raw strings so the field can be emptied while retyping. Holding a
  // number here forces an empty input back to 1 on every keystroke, so typing
  // "250" over it produces 1250.
  const [qty, setQty] = useState<Record<string, string>>({});
  const showManufacturer = hasMultipleManufacturers(product);
  const showDateCode = lots.some((l) => l.dateCode.trim());

  const lineFor = (lotId: string) => items.find((i) => i.productId === lotId);

  /** What the field shows: an edit in progress, else the quantity already quoted. */
  const shownQty = (lot: ProductLot) =>
    qty[lot._id] ?? String(lineFor(lot._id)?.quantity ?? 1);

  const handleAdd = (lot: ProductLot) => {
    // Read what is on screen, not the edit map: an untouched field shows the
    // quantity already in the quote, and submitting 1 instead would silently
    // shrink the customer's line.
    const wanted = Math.max(1, Math.floor(Number(shownQty(lot))) || 1);
    const existing = lineFor(lot._id);
    if (existing) {
      updateQuantity(lot._id, wanted);
      return;
    }
    addItem({
      productId: lot._id,
      partNumber: product.partNumber,
      manufacturer: lot.manufacturer,
      quantity: wanted,
      condition: isProductCondition(lot.condition) ? lot.condition : "",
      dateCode: lot.dateCode,
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-white mb-3">
        Available stock{" "}
        <span className="text-text-secondary font-normal">
          ({lots.length} {lots.length === 1 ? "lot" : "lots"})
        </span>
      </h2>
      <div className="overflow-x-auto border border-border rounded-lg bg-bg-card">
        <table className="w-full text-sm min-w-[32rem]">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th scope="col" className="px-4 py-3 font-medium">Condition</th>
              {showManufacturer ? (
                <th scope="col" className="px-4 py-3 font-medium">Manufacturer</th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-medium">In stock</th>
              {showDateCode ? (
                <th scope="col" className="px-4 py-3 font-medium">Date code</th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => {
              const line = lineFor(lot._id);
              const isCurrent = lot._id === product._id;
              return (
                <tr
                  key={lot._id}
                  className={`border-b border-border last:border-0 ${
                    isCurrent ? "bg-bg-secondary/40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    {isProductCondition(lot.condition) ? (
                      <ProductConditionBadge condition={lot.condition} />
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                  {showManufacturer ? (
                    <td className="px-4 py-3 text-white">
                      {lot.manufacturer || "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-white whitespace-nowrap">
                    {lot.quantity.toLocaleString()}
                  </td>
                  {showDateCode ? (
                    <td className="px-4 py-3 text-text-secondary">
                      {lot.dateCode || "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={shownQty(lot)}
                        onChange={(e) =>
                          setQty((q) => ({ ...q, [lot._id]: e.target.value }))
                        }
                        className="w-20 bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-green-accent"
                        aria-label={`Quantity from the ${lot.condition || "listed"} lot of ${lot.quantity.toLocaleString()}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAdd(lot)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap py-1.5 px-3 rounded-lg text-sm font-medium transition-colors bg-green-brand hover:bg-green-accent text-white cursor-pointer"
                      >
                        {line ? (
                          <>
                            <Check size={14} /> Update
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-text-secondary text-xs mt-2">
        Each lot is quoted separately, so you can request different quantities
        from different stock.
      </p>
    </div>
  );
}
