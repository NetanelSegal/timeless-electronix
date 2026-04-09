import { Package, ShoppingCart, Check } from "lucide-react";
import type { Product } from "../lib/types";
import { useQuote } from "../context/QuoteContext";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { items, addItem } = useQuote();
  const isInQuote = items.some((i) => i.productId === product._id);

  const handleAdd = () => {
    addItem({
      productId: product._id,
      partNumber: product.partNumber,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      ourReference: product.ourReference,
    });
  };

  return (
    <div className="bg-white text-gray-900 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm break-all leading-tight">
          {product.partNumber}
        </h3>
        <span className="flex items-center gap-1 text-xs text-green-brand font-medium whitespace-nowrap">
          <Package size={12} />
          {product.quantity.toLocaleString()}
        </span>
      </div>

      <p className="text-green-brand text-sm font-medium">
        {product.manufacturer || "—"}
      </p>

      <p className="text-gray-500 text-xs line-clamp-2">
        {product.description}
      </p>

      <div className="flex gap-2 text-xs text-gray-400 mt-auto">
        {product.dateCode && (
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            DC: {product.dateCode}
          </span>
        )}
        {product.ourReference && (
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            Ref: {product.ourReference}
          </span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={isInQuote}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isInQuote
            ? "bg-gray-100 text-gray-400 cursor-default"
            : "bg-green-brand hover:bg-green-accent text-white cursor-pointer"
        }`}
      >
        {isInQuote ? (
          <>
            <Check size={14} /> Added to Quote
          </>
        ) : (
          <>
            <ShoppingCart size={14} /> Add to Quote
          </>
        )}
      </button>
    </div>
  );
}
