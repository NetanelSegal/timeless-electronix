import {
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import type { Product } from "../../lib/types";
import CloudinaryImage from "../CloudinaryImage";

function formatSpecValue(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function specEntries(p: Product): [string, string][] {
  const s = p.technicalSpecs;
  if (!s || typeof s !== "object" || Array.isArray(s)) return [];
  return Object.entries(s).map(([k, v]) => [k, formatSpecValue(v)]);
}

async function copyText(label: string, text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.alert(`Could not copy ${label}`);
    return false;
  }
}

export function PartNumberCell({ product: p }: { product: Product }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyText("part number", p.partNumber);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div className="flex min-w-0 items-start gap-1 font-medium">
      <span className="min-w-0 break-all">{p.partNumber}</span>
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-text-secondary hover:text-green-accent"
        title="Copy part number"
        aria-label="Copy part number"
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <Check size={14} className="text-green-accent" aria-hidden />
        ) : (
          <Copy size={14} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function SeoSlugCell({ product: p }: { product: Product }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyText("slug", p.seoSlug);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div className="flex min-w-0 items-start gap-1">
      <span
        className="line-clamp-3 min-w-0 break-all text-text-secondary"
        title={p.seoSlug}
      >
        {p.seoSlug}
      </span>
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-text-secondary hover:text-green-accent"
        title="Copy SEO slug"
        aria-label="Copy SEO slug"
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <Check size={14} className="text-green-accent" aria-hidden />
        ) : (
          <Copy size={14} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function SummaryCell({ product: p }: { product: Product }) {
  return (
    <span
      className="line-clamp-4 text-xs text-text-secondary"
      title={p.productSummary?.trim() || undefined}
    >
      {p.productSummary?.trim() || "—"}
    </span>
  );
}

export function DescriptionCell({ product: p }: { product: Product }) {
  return (
    <span
      className="line-clamp-4 text-xs text-text-secondary"
      title={p.description?.trim() || undefined}
    >
      {p.description?.trim() || "—"}
    </span>
  );
}

export function SpecsCell({ product: p }: { product: Product }) {
  const entries = specEntries(p);
  if (entries.length === 0) {
    return (
      <span className="text-xs text-text-secondary/60" title="No technical specs">
        —
      </span>
    );
  }
  const title = entries.map(([k, v]) => `${k}: ${v}`).join("\n");
  return (
    <div
      className="min-w-0 space-y-1.5"
      title={title}
    >
      <span className="inline-flex items-center rounded border border-border/70 bg-bg-card/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-accent/90">
        {entries.length} {entries.length === 1 ? "spec" : "specs"}
      </span>
      <dl className="max-h-32 space-y-0 overflow-y-auto rounded-md border border-border/50 bg-black/15 py-1 pl-2 pr-1.5 text-[11px] leading-snug">
        {entries.map(([key, val], i) => (
          <div
            key={`${key}-${i}`}
            className="grid grid-cols-1 gap-0.5 border-b border-border/25 py-1.5 last:border-b-0 sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)] sm:gap-x-2"
          >
            <dt className="wrap-break-word font-medium text-text-secondary">
              {key}
            </dt>
            <dd className="wrap-break-word text-text-secondary/80 sm:border-l sm:border-border/30 sm:pl-2">
              {val}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProductImagesCell({
  product: p,
  uploading,
  onManageImages,
  onPickImage,
}: {
  product: Product;
  uploading: boolean;
  onManageImages: () => void;
  onPickImage: (file: File) => void;
}) {
  return (
    <div
      className="relative flex min-h-8 min-w-32 flex-wrap items-center gap-2"
      aria-busy={uploading}
    >
      {p.imageUrls[0] ? (
        <CloudinaryImage
          src={p.imageUrls[0]}
          alt={p.partNumber}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded object-cover"
        />
      ) : (
        <span className="w-8 text-center text-xs text-text-secondary">—</span>
      )}
      <span className="whitespace-nowrap text-xs text-text-secondary">
        {p.imageUrls.length}
      </span>
      <button
        type="button"
        disabled={uploading}
        onClick={onManageImages}
        className="text-xs text-green-accent hover:underline disabled:pointer-events-none disabled:opacity-40"
      >
        Manage
      </button>
      <label
        className={`shrink-0 text-text-secondary hover:text-green-accent ${uploading
          ? "pointer-events-none cursor-not-allowed opacity-40"
          : "cursor-pointer"
          }`}
        title="Add image"
      >
        <Upload size={14} aria-hidden />
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickImage(f);
            e.target.value = "";
          }}
        />
      </label>
      {uploading ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-md border border-border/80 bg-bg-secondary/90 text-xs font-medium text-green-accent"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Uploading…
        </div>
      ) : null}
    </div>
  );
}

export function ProductActionsCell({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="text-text-secondary hover:text-green-accent"
        aria-label={`Edit product ${p.partNumber}`}
      >
        <Pencil size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-text-secondary hover:text-red-400"
        aria-label={`Delete product ${p.partNumber}`}
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  );
}
