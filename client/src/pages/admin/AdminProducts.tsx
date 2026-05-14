import { useState, useRef, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Upload } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { Product } from "../../lib/types";
import Pagination from "../../components/Pagination";
import AdminProductsFilters from "../../components/admin/AdminProductsFilters";
import AdminProductsTable from "../../components/admin/AdminProductsTable";
import { useAdminProductsListState, ADMIN_PAGE_SIZE } from "../../hooks/admin/useAdminProductsListState";
import { useAdminProductsQuery } from "../../hooks/admin/useAdminProductsQuery";
import { useAdminProductsColumnVisibility } from "../../hooks/admin/useAdminProductsColumnVisibility";
import { ProductFormModal, ProductImagesModal } from "./AdminProductsModals";

export default function AdminProducts() {
  const [, setSearchParams] = useSearchParams();
  const {
    searchFromUrl,
    searchInput,
    setSearchInput,
    page,
    sortField,
    sortOrder,
    listQuery,
    searchField,
    manufacturer,
    minQty,
    maxQty,
    isSample,
    hasImages,
    missingSlug,
    setPage,
    setSortColumn,
    patchParams,
    clearFilters,
    flushSearchToUrl,
    filtersOpen,
    setFiltersOpen,
  } = useAdminProductsListState();

  const { data, error, loading, refetch } = useAdminProductsQuery(listQuery);
  const { cols, setShowSummary, setShowDescription } =
    useAdminProductsColumnVisibility();

  const [actionError, setActionError] = useState("");
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [manageImagesFor, setManageImagesFor] = useState<Product | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!data || data.totalPages < 1) return;
    if (page > data.totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(data.totalPages));
        return next;
      }, { replace: true });
    }
  }, [data, page, setSearchParams]);

  useEffect(() => {
    if (!manageImagesFor || !data?.products) return;
    const next = data.products.find((p) => p._id === manageImagesFor._id);
    if (next && next.updatedAt !== manageImagesFor.updatedAt) {
      setManageImagesFor(next);
    }
  }, [data, manageImagesFor]);

  const csvRef = useRef<HTMLInputElement>(null);

  const hasExtraFilters =
    !!searchField ||
    !!manufacturer ||
    !!minQty ||
    !!maxQty ||
    isSample === "true" ||
    hasImages === "true" ||
    missingSlug === "true";

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    flushSearchToUrl();
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
              if (file) void handleCsvImport(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="flex items-center gap-2 bg-bg-card border border-border hover:border-green-accent text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            type="button"
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

      <AdminProductsFilters
        searchField={searchField}
        manufacturer={manufacturer}
        minQty={minQty}
        maxQty={maxQty}
        isSample={isSample}
        hasImages={hasImages}
        missingSlug={missingSlug}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        onPatch={patchParams}
      />

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search catalog (respects scope in Filters)…"
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
        {(searchFromUrl ||
          hasExtraFilters ||
          sortField !== "updatedAt" ||
          sortOrder !== "desc") && (
          <button
            type="button"
            onClick={clearFilters}
            className="border border-border px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-white hover:border-green-accent transition-colors"
          >
            Clear filters
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-text-secondary">
        <span>Columns:</span>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cols.showSummary}
            onChange={(e) => setShowSummary(e.target.checked)}
            className="rounded border-border"
          />
          Summary
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cols.showDescription}
            onChange={(e) => setShowDescription(e.target.checked)}
            className="rounded border-border"
          />
          Description
        </label>
      </div>

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
          {data && data.products.length > 0 ? (
            <AdminProductsTable
              products={data.products}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortColumn={setSortColumn}
              showSummary={cols.showSummary}
              showDescription={cols.showDescription}
              uploadingProductId={uploadingProductId}
              onEdit={(p) => {
                setEditProduct(p);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onManageImages={setManageImagesFor}
              onImageUpload={handleImageUpload}
            />
          ) : null}

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
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {showForm && (
        <ProductFormModal
          key={editProduct?._id ?? "new"}
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
