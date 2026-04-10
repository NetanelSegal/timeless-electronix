import { useState, useRef, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Upload,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { Product, ProductsResponse } from "../../lib/types";
import Pagination from "../../components/Pagination";
import CloudinaryImage from "../../components/CloudinaryImage";
import { useAsyncQuery } from "../../hooks/useAsyncQuery";

const ADMIN_PAGE_SIZE = 50;

const ADMIN_PRODUCT_SORT_FIELDS = [
  "updatedAt",
  "partNumber",
  "manufacturer",
  "quantity",
  "ourReference",
] as const;

const ADMIN_PRODUCT_FIELD_ORDER: Record<string, "asc" | "desc"> = {
  updatedAt: "desc",
  partNumber: "asc",
  manufacturer: "asc",
  quantity: "desc",
  ourReference: "asc",
};

function effectiveAdminProductSort(searchParams: URLSearchParams): {
  field: string;
  order: "asc" | "desc";
} {
  const raw = searchParams.get("sort")?.trim();
  const field =
    raw &&
    (ADMIN_PRODUCT_SORT_FIELDS as readonly string[]).includes(raw)
      ? raw
      : "updatedAt";
  const o = searchParams.get("order")?.toLowerCase();
  const order: "asc" | "desc" =
    o === "asc" || o === "desc" ? o : ADMIN_PRODUCT_FIELD_ORDER[field] ?? "desc";
  return { field, order };
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const { field: sortField, order: sortOrder } =
    effectiveAdminProductSort(searchParams);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [actionError, setActionError] = useState("");
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [manageImagesFor, setManageImagesFor] = useState<Product | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      if (q === searchFromUrl) return;
      const next = new URLSearchParams(searchParams);
      if (q) next.set("search", q);
      else next.delete("search");
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, searchFromUrl, searchParams, setSearchParams]);

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const setSortColumn = (field: string) => {
    const next = new URLSearchParams(searchParams);
    if (sortField === field) {
      next.set("order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      next.set("sort", field);
      next.set("order", ADMIN_PRODUCT_FIELD_ORDER[field] ?? "desc");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const { data, error, loading, refetch } = useAsyncQuery(
    () => {
      const params = new URLSearchParams();
      if (searchFromUrl) params.set("search", searchFromUrl);
      params.set("page", String(page));
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("sort", sortField);
      params.set("order", sortOrder);
      return adminApi.get<ProductsResponse>(`/products?${params}`);
    },
    [searchFromUrl, page, sortField, sortOrder],
    { showLoadingOnRefetch: true },
  );

  useEffect(() => {
    if (!data || data.totalPages < 1) return;
    if (page > data.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(data.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [data, page, searchParams, setSearchParams]);

  useEffect(() => {
    if (!manageImagesFor || !data?.products) return;
    const next = data.products.find((p) => p._id === manageImagesFor._id);
    if (next && next.updatedAt !== manageImagesFor.updatedAt) {
      setManageImagesFor(next);
    }
  }, [data, manageImagesFor]);
  const csvRef = useRef<HTMLInputElement>(null);

  const flushSearchToUrl = () => {
    const next = new URLSearchParams(searchParams);
    const q = searchInput.trim();
    if (q) next.set("search", q);
    else next.delete("search");
    next.set("page", "1");
    setSearchParams(next);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    flushSearchToUrl();
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("page", "1");
    setSearchParams(next);
    setSearchInput("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setActionError("");
    try {
      await adminApi.delete(`/products/${id}`);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    }
  };

  const handleCsvImport = async (file: File) => {
    setActionError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await adminApi.upload<{ imported: number }>(
        "/products/import",
        fd,
      );
      alert(`Imported ${result.imported} products`);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "CSV import failed",
      );
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setActionError("");
    setUploadingProductId(productId);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await adminApi.upload<Product>(`/products/${productId}/images`, fd);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Image upload failed",
      );
    } finally {
      setUploadingProductId(null);
    }
  };

  const handleSave = async (formData: Partial<Product>) => {
    setActionError("");
    try {
      if (editProduct?._id) {
        await adminApi.put(`/products/${editProduct._id}`, formData);
      } else {
        await adminApi.post("/products", formData);
      }
      setShowForm(false);
      setEditProduct(null);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save product",
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={csvRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvImport(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => csvRef.current?.click()}
            className="flex items-center gap-2 bg-bg-card border border-border hover:border-green-accent text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            onClick={() => {
              setEditProduct({});
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-green-brand hover:bg-green-accent text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {(error || actionError) && (
        <p className="text-red-400 text-sm mb-4">{actionError || error}</p>
      )}

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search part number, manufacturer, reference, description…"
            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:border-green-accent"
            aria-label="Search products"
          />
        </div>
        <button
          type="submit"
          className="bg-bg-card border border-border px-4 py-2 rounded-lg text-sm hover:border-green-accent transition-colors"
        >
          Search
        </button>
        {(searchFromUrl || sortField !== "updatedAt" || sortOrder !== "desc") && (
          <button
            type="button"
            onClick={clearFilters}
            className="border border-border px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-white hover:border-green-accent transition-colors"
          >
            Clear filters
          </button>
        )}
      </form>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <>
          {data && data.total > 0 && (
            <p className="text-text-secondary text-sm mb-3">
              {(() => {
                const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
                const to = Math.min(page * ADMIN_PAGE_SIZE, data.total);
                return `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${data.total.toLocaleString()}`;
              })()}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Product inventory. Column headers are buttons that sort the table.
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <SortableTh
                    field="partNumber"
                    label="Part Number"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={setSortColumn}
                  />
                  <SortableTh
                    field="manufacturer"
                    label="Manufacturer"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={setSortColumn}
                  />
                  <SortableTh
                    field="quantity"
                    label="Qty"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={setSortColumn}
                  />
                  <SortableTh
                    field="ourReference"
                    label="Reference"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={setSortColumn}
                  />
                  <SortableTh
                    field="updatedAt"
                    label="Updated"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={setSortColumn}
                  />
                  <th scope="col" className="pb-3 pr-4 font-medium">
                    Images
                  </th>
                  <th scope="col" className="pb-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.products.map((p) => (
                  <tr key={p._id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium">{p.partNumber}</td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {p.manufacturer}
                    </td>
                    <td className="py-3 pr-4">
                      {p.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {p.ourReference}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <div
                        className="relative flex flex-wrap items-center gap-2 min-h-8 min-w-32"
                        aria-busy={uploadingProductId === p._id}
                      >
                        {p.imageUrls[0] ? (
                          <CloudinaryImage
                            src={p.imageUrls[0]}
                            alt={p.partNumber}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover shrink-0"
                          />
                        ) : (
                          <span className="text-text-secondary text-xs w-8 text-center">
                            —
                          </span>
                        )}
                        <span className="text-text-secondary text-xs whitespace-nowrap">
                          {p.imageUrls.length}
                        </span>
                        <button
                          type="button"
                          disabled={!!uploadingProductId}
                          onClick={() => setManageImagesFor(p)}
                          className="text-xs text-green-accent hover:underline disabled:opacity-40 disabled:pointer-events-none"
                        >
                          Manage
                        </button>
                        <label
                          className={`shrink-0 text-text-secondary hover:text-green-accent ${
                            uploadingProductId
                              ? "opacity-40 cursor-not-allowed pointer-events-none"
                              : "cursor-pointer"
                          }`}
                          title="Add image"
                        >
                          <Upload size={14} aria-hidden />
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!!uploadingProductId}
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleImageUpload(p._id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {uploadingProductId === p._id ? (
                          <div
                            className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-bg-secondary/90 border border-border/80 text-xs font-medium text-green-accent z-10"
                            aria-live="polite"
                          >
                            <Loader2
                              className="w-4 h-4 animate-spin shrink-0"
                              aria-hidden
                            />
                            Uploading…
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditProduct(p);
                            setShowForm(true);
                          }}
                          className="text-text-secondary hover:text-green-accent"
                          aria-label={`Edit product ${p.partNumber}`}
                        >
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          className="text-text-secondary hover:text-red-400"
                          aria-label={`Delete product ${p.partNumber}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.products.length === 0 && (
            <p className="text-text-secondary text-sm py-8">
              No products match your search or filters.{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="text-green-accent hover:underline"
              >
                Clear filters
              </button>
            </p>
          )}

          {data && data.products.length > 0 && (
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditProduct(null);
          }}
        />
      )}

      {manageImagesFor && (
        <ProductImagesModal
          product={manageImagesFor}
          onClose={() => setManageImagesFor(null)}
          onSaved={() => void refetch()}
        />
      )}
    </div>
  );
}

function SortableTh({
  field,
  label,
  sortField,
  sortOrder,
  onSort,
}: {
  field: string;
  label: string;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const active = sortField === field;
  const ariaSort = active
    ? sortOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="pb-3 pr-4 font-medium align-bottom"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 max-w-full text-left text-text-secondary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent rounded"
      >
        <span>{label}</span>
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp
              size={14}
              className="shrink-0 text-green-accent"
              aria-hidden
            />
          ) : (
            <ArrowDown
              size={14}
              className="shrink-0 text-green-accent"
              aria-hidden
            />
          )
        ) : null}
      </button>
    </th>
  );
}

function ProductImagesModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [urls, setUrls] = useState<string[]>(() => [...product.imageUrls]);
  const [localErr, setLocalErr] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUrls([...product.imageUrls]);
  }, [product._id, product.imageUrls.join("|")]);

  const handleUpload = async (file: File) => {
    setLocalErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const updated = await adminApi.upload<Product>(
        `/products/${product._id}/images`,
        fd,
      );
      setUrls([...updated.imageUrls]);
      onSaved();
    } catch (err) {
      setLocalErr(
        err instanceof Error ? err.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm("Remove this image from the product?")) return;
    setLocalErr("");
    try {
      const updated = await adminApi.delete<Product>(
        `/products/${product._id}/images`,
        { url },
      );
      setUrls([...updated.imageUrls]);
      onSaved();
    } catch (err) {
      setLocalErr(
        err instanceof Error ? err.message : "Failed to remove image",
      );
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= urls.length) return;
    const next = [...urls];
    const a = next[index];
    const b = next[j];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[j] = a;
    setLocalErr("");
    try {
      const updated = await adminApi.put<Product>(
        `/products/${product._id}/images`,
        { imageUrls: next },
      );
      setUrls([...updated.imageUrls]);
      onSaved();
    } catch (err) {
      setLocalErr(
        err instanceof Error ? err.message : "Failed to reorder images",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="bg-bg-secondary border border-border rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        aria-busy={uploading}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            Images — {product.partNumber}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="text-text-secondary hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {localErr ? (
          <p className="text-red-400 text-sm mb-3">{localErr}</p>
        ) : null}

        {uploading ? (
          <p
            className="text-xs text-text-secondary mb-2 flex items-center gap-2"
            aria-live="polite"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-green-accent" />
            Uploading image — please wait
          </p>
        ) : null}

        <label
          className={`flex items-center justify-center gap-2 w-full py-3 mb-4 border border-dashed rounded-lg text-sm transition-colors ${
            uploading
              ? "border-border/60 bg-bg-card/50 text-text-secondary/70 cursor-wait"
              : "border-border text-text-secondary cursor-pointer hover:border-green-accent"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-green-accent" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={16} aria-hidden />
              <span>Upload image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>

        {urls.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-4">
            No images yet. Upload one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {urls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-3 bg-bg-card border border-border rounded-lg p-2"
              >
                <CloudinaryImage
                  src={url}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary truncate" title={url}>
                    {url}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={uploading || i === 0}
                    onClick={() => void move(i, -1)}
                    className="p-1 rounded text-text-secondary hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={uploading || i === urls.length - 1}
                    onClick={() => void move(i, 1)}
                    className="p-1 rounded text-text-secondary hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleDelete(url)}
                  className="p-2 text-text-secondary hover:text-red-400 shrink-0 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm bg-bg-card border border-border rounded-lg hover:border-green-accent disabled:opacity-40 disabled:pointer-events-none"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({
  product,
  onSave,
  onClose,
}: {
  product: Partial<Product> | null;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    partNumber: product?.partNumber || "",
    manufacturer: product?.manufacturer || "",
    description: product?.description || "",
    quantity: product?.quantity || 0,
    ourReference: product?.ourReference || "",
    dateCode: product?.dateCode || "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            {product?._id ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary">
                Part Number *
              </label>
              <input
                required
                value={form.partNumber}
                onChange={(e) =>
                  setForm({ ...form, partNumber: e.target.value })
                }
                className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">
                Manufacturer
              </label>
              <input
                value={form.manufacturer}
                onChange={(e) =>
                  setForm({ ...form, manufacturer: e.target.value })
                }
                className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Reference</label>
              <input
                value={form.ourReference}
                onChange={(e) =>
                  setForm({ ...form, ourReference: e.target.value })
                }
                className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Date Code</label>
              <input
                value={form.dateCode}
                onChange={(e) =>
                  setForm({ ...form, dateCode: e.target.value })
                }
                className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-brand hover:bg-green-accent text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
