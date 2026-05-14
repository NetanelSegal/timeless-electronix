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

function specCount(p: Product): number {
  const s = p.technicalSpecs;
  if (!s || typeof s !== "object" || Array.isArray(s)) return 0;
  return Object.keys(s).length;
}

function specPreview(p: Product): string {
  const s = p.technicalSpecs;
  if (!s || typeof s !== "object" || Array.isArray(s)) return "—";
  const keys = Object.keys(s).slice(0, 2);
  if (keys.length === 0) return "0 specs";
  return keys.join(", ") + (Object.keys(s).length > 2 ? "…" : "");
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

type Props = {
  product: Product;
  showSummary: boolean;
  showDescription: boolean;
  uploading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManageImages: () => void;
  onPickImage: (file: File) => void;
};

export default function AdminProductTableRow({
  product: p,
  showSummary,
  showDescription,
  uploading,
  onEdit,
  onDelete,
  onManageImages,
  onPickImage,
}: Props) {
  const [copied, setCopied] = useState<"slug" | "part" | null>(null);

  const handleCopy = async (kind: "slug" | "part", text: string) => {
    const ok = await copyText(kind === "slug" ? "slug" : "part number", text);
    if (ok) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const nSpecs = specCount(p);

  return (
    <tr className="border-b border-border/50 hover:bg-bg-card/50 transition-colors">
      <td className="py-3 pr-4 font-medium align-top">
        <div className="flex items-start gap-1">
          <span className="break-all min-w-0">{p.partNumber}</span>
          <button
            type="button"
            className="shrink-0 p-0.5 rounded text-text-secondary hover:text-green-accent"
            title="Copy part number"
            aria-label="Copy part number"
            onClick={() => void handleCopy("part", p.partNumber)}
          >
            {copied === "part" ? (
              <Check size={14} className="text-green-accent" aria-hidden />
            ) : (
              <Copy size={14} aria-hidden />
            )}
          </button>
        </div>
      </td>
      <td className="py-3 pr-4 text-text-secondary align-top max-w-[12rem]">
        <div className="flex items-start gap-1">
          <span className="line-clamp-2 break-all min-w-0" title={p.seoSlug}>
            {p.seoSlug}
          </span>
          <button
            type="button"
            className="shrink-0 p-0.5 rounded text-text-secondary hover:text-green-accent"
            title="Copy SEO slug"
            aria-label="Copy SEO slug"
            onClick={() => void handleCopy("slug", p.seoSlug)}
          >
            {copied === "slug" ? (
              <Check size={14} className="text-green-accent" aria-hidden />
            ) : (
              <Copy size={14} aria-hidden />
            )}
          </button>
        </div>
      </td>
      {showSummary ? (
        <td
          className="py-3 pr-4 text-text-secondary align-top max-w-[14rem]"
          title={p.productSummary || undefined}
        >
          <span className="line-clamp-2 text-xs">
            {p.productSummary?.trim() || "—"}
          </span>
        </td>
      ) : null}
      {showDescription ? (
        <td
          className="py-3 pr-4 text-text-secondary align-top max-w-[16rem]"
          title={p.description || undefined}
        >
          <span className="line-clamp-2 text-xs">
            {p.description?.trim() || "—"}
          </span>
        </td>
      ) : null}
      <td className="py-3 pr-4 text-text-secondary align-top text-xs font-mono" title={specPreview(p)}>
        {nSpecs === 0 ? "—" : `${nSpecs} specs`}
        {nSpecs > 0 ? (
          <span className="block text-text-secondary/70 truncate mt-0.5">
            {specPreview(p)}
          </span>
        ) : null}
      </td>
      <td className="py-3 pr-4 text-text-secondary align-top whitespace-nowrap text-xs">
        {p.dateCode || "—"}
      </td>
      <td className="py-3 pr-4 align-top">
        {p.isSample ? (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-brand/25 text-green-accent">
            Sample
          </span>
        ) : (
          <span className="text-text-secondary text-xs">No</span>
        )}
      </td>
      <td className="py-3 pr-4 text-text-secondary align-top">
        {p.manufacturer}
      </td>
      <td className="py-3 pr-4 align-top">{p.quantity.toLocaleString()}</td>
      <td className="py-3 pr-4 text-text-secondary align-top">
        {p.ourReference}
      </td>
      <td className="py-3 pr-4 text-text-secondary whitespace-nowrap align-top text-xs">
        {new Date(p.updatedAt).toLocaleDateString()}
      </td>
      <td className="py-3 pr-4 align-top">
        <div
          className="relative flex flex-wrap items-center gap-2 min-h-8 min-w-32"
          aria-busy={uploading}
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
            <span className="text-text-secondary text-xs w-8 text-center">—</span>
          )}
          <span className="text-text-secondary text-xs whitespace-nowrap">
            {p.imageUrls.length}
          </span>
          <button
            type="button"
            disabled={uploading}
            onClick={onManageImages}
            className="text-xs text-green-accent hover:underline disabled:opacity-40 disabled:pointer-events-none"
          >
            Manage
          </button>
          <label
            className={`shrink-0 text-text-secondary hover:text-green-accent ${
              uploading
                ? "opacity-40 cursor-not-allowed pointer-events-none"
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
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-bg-secondary/90 border border-border/80 text-xs font-medium text-green-accent z-10"
              aria-live="polite"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
              Uploading…
            </div>
          ) : null}
        </div>
      </td>
      <td className="py-3 align-top">
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
      </td>
    </tr>
  );
}
