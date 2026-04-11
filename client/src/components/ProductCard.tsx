import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart } from "lucide-react";
import type { Product } from "../lib/types";
import { useQuote } from "../context/QuoteContext";
import CloudinaryImage from "./CloudinaryImage";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { items, addItem, updateQuantity } = useQuote();
  const [addQty, setAddQty] = useState(1);
  const isInQuote = items.some((i) => i.productId === product._id);
  const quoteLineQty = items.find((i) => i.productId === product._id)?.quantity;

  useEffect(() => {
    if (quoteLineQty !== undefined) {
      setAddQty(quoteLineQty);
    } else {
      setAddQty(1);
    }
  }, [product._id, quoteLineQty]);

  const handleQuoteAction = () => {
    const quantity = Math.max(1, Math.floor(Number(addQty)) || 1);
    if (isInQuote) {
      updateQuantity(product._id, quantity);
      return;
    }
    addItem({
      productId: product._id,
      partNumber: product.partNumber,
      manufacturer: product.manufacturer,
      quantity,
      ourReference: product.ourReference,
    });
  };

  return (
    <div className="bg-white text-gray-900 rounded-lg p-5 flex flex-col gap-3">
      {product.imageUrls[0] ? (
        <CloudinaryImage
          src={product.imageUrls[0]}
          alt={product.partNumber}
          width={400}
          height={300}
          className="w-full h-36 object-cover rounded-md -mt-1"
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm break-all leading-tight">
          <Link
            to={`/catalog/${product._id}`}
            className="text-gray-900 hover:text-green-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-brand rounded"
          >
            {product.partNumber}
          </Link>
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

      <Link
        to={`/catalog/${product._id}`}
        className="text-center text-xs text-green-accent font-medium hover:underline"
      >
        View details
      </Link>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <span>Qty</span>
          <input
            type="number"
            min={1}
            value={addQty}
            onChange={(e) =>
              setAddQty(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-14 border border-gray-200 rounded px-1.5 py-1 text-gray-900 text-xs"
            aria-label={
              isInQuote
                ? "Quantity in your quote"
                : "Quantity to add to quote"
            }
            onClick={(e) => e.stopPropagation()}
          />
        </label>
        <button
          type="button"
          onClick={handleQuoteAction}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-green-brand hover:bg-green-accent text-white cursor-pointer"
        >
          {isInQuote ? (
            <>
              <ShoppingCart size={14} /> Update quantity
            </>
          ) : (
            <>
              <ShoppingCart size={14} /> Add to Quote
            </>
          )}
        </button>
      </div>
    </div>
  );
}
