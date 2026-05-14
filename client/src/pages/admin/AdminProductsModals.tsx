import { useState, useEffect, type FormEvent } from "react";
import {
  Upload,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Plus,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { Product } from "../../lib/types";
import CloudinaryImage from "../../components/CloudinaryImage";

type SpecRow = { id: string; key: string; value: string };

function newSpecRow(): SpecRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    key: "",
    value: "",
  };
}

function rowsFromTechnicalSpecs(
  specs: Product["technicalSpecs"],
): SpecRow[] {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
    return [newSpecRow()];
  }
  const entries = Object.entries(specs);
  if (entries.length === 0) return [newSpecRow()];
  return entries.map(([k, v]) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${k}`,
    key: k,
    value: typeof v === "boolean" ? (v ? "true" : "false") : String(v),
  }));
}

function recordFromSpecRows(
  rows: SpecRow[],
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const row of rows) {
    const k = row.key.trim();
    if (!k) continue;
    const raw = row.value.trim();
    if (raw === "true") out[k] = true;
    else if (raw === "false") out[k] = false;
    else if (/^-?\d+(\.\d+)?$/.test(raw)) out[k] = Number(raw);
    else out[k] = raw;
  }
  return out;
}

export function ProductImagesModal({
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

export function ProductFormModal({
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
    quantity: product?.quantity ?? 0,
    ourReference: product?.ourReference || "",
    dateCode: product?.dateCode || "",
    seoSlug: product?.seoSlug || "",
    productSummary: product?.productSummary || "",
  });

  const [specRows, setSpecRows] = useState<SpecRow[]>(() =>
    rowsFromTechnicalSpecs(product?.technicalSpecs),
  );

  useEffect(() => {
    setSpecRows(rowsFromTechnicalSpecs(product?.technicalSpecs));
  }, [product?._id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const technicalSpecs = recordFromSpecRows(specRows);
    onSave({
      ...form,
      technicalSpecs,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            {product?._id ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
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
                SEO slug *{" "}
                <span className="text-text-secondary/80">(a-z 0-9 -)</span>
              </label>
              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Lowercase letters, digits, and hyphens only"
                value={form.seoSlug}
                onChange={(e) =>
                  setForm({ ...form, seoSlug: e.target.value.toLowerCase() })
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
            <label className="text-xs text-text-secondary">
              Product summary (meta description)
            </label>
            <textarea
              rows={2}
              value={form.productSummary}
              onChange={(e) =>
                setForm({ ...form, productSummary: e.target.value })
              }
              className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              placeholder="Short summary for search snippets"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full mt-1 bg-bg-card border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-text-secondary">
                Technical specs
              </label>
              <button
                type="button"
                onClick={() => setSpecRows((rows) => [...rows, newSpecRow()])}
                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary hover:border-green-accent hover:text-green-accent"
              >
                <Plus size={14} aria-hidden />
                Add pair
              </button>
            </div>
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-bg-card p-3">
              {specRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                >
                  <input
                    aria-label={`Spec key ${index + 1}`}
                    placeholder="Key"
                    value={row.key}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSpecRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, key: v } : r,
                        ),
                      );
                    }}
                    className="min-w-0 flex-1 rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-white focus:border-green-accent focus:outline-none sm:max-w-[40%]"
                  />
                  <input
                    aria-label={`Spec value ${index + 1}`}
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSpecRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, value: v } : r,
                        ),
                      );
                    }}
                    className="min-w-0 flex-1 rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-white focus:border-green-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSpecRows((rows) => {
                        const next = rows.filter((r) => r.id !== row.id);
                        return next.length > 0 ? next : [newSpecRow()];
                      })
                    }
                    className="shrink-0 rounded p-2 text-text-secondary hover:text-red-400"
                    aria-label={`Remove spec row ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-text-secondary/80">
              Values <code className="text-text-secondary">true</code> /{" "}
              <code className="text-text-secondary">false</code> become
              booleans; plain numbers become numbers; otherwise text.
            </p>
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
