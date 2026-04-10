import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Package, ShoppingCart, Check } from "lucide-react";
import { api } from "../lib/api";
import type { Product } from "../lib/types";
import { isValidObjectId } from "../lib/objectId";
import { absoluteUrl } from "../lib/siteUrl";
import { COMPANY } from "../lib/constants";
import CloudinaryImage from "../components/CloudinaryImage";
import { useQuote } from "../context/QuoteContext";
import PageSeo from "../components/PageSeo";

function productJsonLd(product: Product, canonical: string) {
  const name = `${product.partNumber}${product.manufacturer ? ` — ${product.manufacturer}` : ""}`;
  const desc =
    product.description?.trim() ||
    `${product.partNumber} electronic component${product.manufacturer ? ` by ${product.manufacturer}` : ""}.`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: desc,
    sku: product.partNumber,
    mpn: product.partNumber,
  };
  const imgs = product.imageUrls;
  if (imgs.length === 1) {
    data.image = imgs[0];
  } else if (imgs.length > 1) {
    data.image = imgs;
  }
  if (product.manufacturer) {
    data.brand = { "@type": "Brand", name: product.manufacturer };
  }
  if (canonical.startsWith("http")) {
    data.url = canonical;
  }
  return JSON.stringify(data);
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { items, addItem } = useQuote();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const path = productId ? `/catalog/${productId}` : "/catalog";

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    setActiveImageIndex((i) => {
      if (product.imageUrls.length === 0) return 0;
      return Math.min(i, product.imageUrls.length - 1);
    });
  }, [product?._id, product?.imageUrls.join("|")]);

  useEffect(() => {
    if (!isValidObjectId(productId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    api
      .get<Product>(`/products/${productId}`)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!isValidObjectId(productId)) {
    return <Navigate to="/catalog" replace />;
  }

  if (loading) {
    return (
      <>
        <PageSeo
          title="Product details"
          description={`${COMPANY.name} electronic components catalog.`}
          path={path}
        />
        <section className="max-w-4xl mx-auto px-4 py-20 text-text-secondary text-center">
          Loading product…
        </section>
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <PageSeo
          title="Product not found"
          description="This part is not in our catalog or the link is invalid."
          path={path}
        />
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Product not found
          </h1>
          <p className="text-text-secondary mb-8">
            This item may have been removed or the link is incorrect.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-green-accent font-medium hover:underline"
          >
            <ArrowLeft size={18} /> Back to catalog
          </Link>
        </section>
      </>
    );
  }

  const canonical = absoluteUrl(`/catalog/${product._id}`);
  const images = product.imageUrls;
  const titleBase = `${product.partNumber} — ${product.manufacturer || "Component"}`;
  const metaDescription =
    product.description?.trim().slice(0, 160) ||
    `${product.partNumber}${product.manufacturer ? ` by ${product.manufacturer}` : ""}. In stock at ${COMPANY.name}. Request a quote online.`;
  const isInQuote = items.some((i) => i.productId === product._id);

  const handleAdd = () => {
    const qty = Number(product.quantity);
    const quantity =
      Number.isFinite(qty) && qty >= 1 ? Math.floor(qty) : 1;
    addItem({
      productId: product._id,
      partNumber: product.partNumber,
      manufacturer: product.manufacturer,
      quantity,
      ourReference: product.ourReference,
    });
  };

  return (
    <>
      <PageSeo
        title={titleBase}
        description={metaDescription}
        path={`/catalog/${product._id}`}
        ogImage={images[0]}
      />
      <Helmet>
        <script type="application/ld+json">
          {productJsonLd(product, canonical)}
        </script>
      </Helmet>

      <section className="bg-bg-secondary border-b border-border py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-sm text-green-accent hover:underline mb-6"
          >
            <ArrowLeft size={16} /> Back to catalog
          </Link>
          <div className="flex flex-col md:flex-row gap-8">
            {images.length > 0 ? (
              <div className="shrink-0 w-full md:w-72 space-y-3">
                <CloudinaryImage
                  src={images[activeImageIndex] ?? images[0]!}
                  alt={product.partNumber}
                  width={400}
                  height={300}
                  className="w-full rounded-lg object-cover border border-border"
                />
                {images.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, idx) => (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent ${
                          idx === activeImageIndex
                            ? "border-green-accent"
                            : "border-border opacity-80 hover:opacity-100"
                        }`}
                        aria-label={`Show image ${idx + 1}`}
                      >
                        <CloudinaryImage
                          src={url}
                          alt=""
                          width={72}
                          height={72}
                          className="w-16 h-16 object-cover block"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white break-all mb-2">
                {product.partNumber}
              </h1>
              <p className="text-green-brand font-medium mb-4">
                {product.manufacturer || "—"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-6">
                <span className="inline-flex items-center gap-1 bg-bg-card px-3 py-1 rounded-lg border border-border">
                  <Package size={14} className="text-green-accent" />
                  {product.quantity.toLocaleString()} in stock
                </span>
                {product.dateCode ? (
                  <span className="bg-bg-card px-3 py-1 rounded-lg border border-border">
                    DC: {product.dateCode}
                  </span>
                ) : null}
                {product.ourReference ? (
                  <span className="bg-bg-card px-3 py-1 rounded-lg border border-border">
                    Ref: {product.ourReference}
                  </span>
                ) : null}
              </div>
              {product.description ? (
                <p className="text-text-secondary text-sm leading-relaxed mb-8">
                  {product.description}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleAdd}
                disabled={isInQuote}
                className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-medium transition-colors ${
                  isInQuote
                    ? "bg-gray-700 text-gray-400 cursor-default"
                    : "bg-green-brand hover:bg-green-accent text-white cursor-pointer"
                }`}
              >
                {isInQuote ? (
                  <>
                    <Check size={18} /> Added to quote
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
