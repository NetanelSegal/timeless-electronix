import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  Search,
  Plus,
  Upload,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { Product, ProductsResponse } from "../../lib/types";

export default function AdminProducts() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "50");
    adminApi
      .get<ProductsResponse>(`/products?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await adminApi.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleCsvImport = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const result = await adminApi.upload<{ imported: number }>(
      "/products/import",
      fd,
    );
    alert(`Imported ${result.imported} products`);
    fetchProducts();
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    await adminApi.upload(`/products/${productId}/image`, fd);
    fetchProducts();
  };

  const handleSave = async (formData: Partial<Product>) => {
    if (editProduct?._id) {
      await adminApi.put(`/products/${editProduct._id}`, formData);
    } else {
      await adminApi.post("/products", formData);
    }
    setShowForm(false);
    setEditProduct(null);
    fetchProducts();
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

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:border-green-accent"
          />
        </div>
        <button
          type="submit"
          className="bg-bg-card border border-border px-4 py-2 rounded-lg text-sm hover:border-green-accent transition-colors"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="pb-3 pr-4">Part Number</th>
                  <th className="pb-3 pr-4">Manufacturer</th>
                  <th className="pb-3 pr-4">Qty</th>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Image</th>
                  <th className="pb-3">Actions</th>
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
                    <td className="py-3 pr-4">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <label className="cursor-pointer text-text-secondary hover:text-green-accent">
                          <Image size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageUpload(p._id, f);
                            }}
                          />
                        </label>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditProduct(p);
                            setShowForm(true);
                          }}
                          className="text-text-secondary hover:text-green-accent"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-text-secondary hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-border rounded hover:border-green-accent disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-text-secondary">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
                className="p-2 border border-border rounded hover:border-green-accent disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
