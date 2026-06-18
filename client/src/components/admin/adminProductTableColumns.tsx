import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Product } from "../../lib/types";
import ProductConditionBadge from "../ProductConditionBadge";
import {
  DescriptionCell,
  PartNumberCell,
  ProductActionsCell,
  ProductImagesCell,
  SeoSlugCell,
  SpecsCell,
  SummaryCell,
} from "./AdminProductsTableCells";

const ch = createColumnHelper<Product>();

export type AdminProductTableColumnDeps = {
  sortField: string;
  sortOrder: "asc" | "desc";
  onSortColumn: (field: string) => void;
  uploadingProductId: string | null;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onManageImages: (p: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
};

function SortableHeaderButton({
  label,
  sortKey,
  sortField,
  sortOrder,
  onSort,
}: {
  label: string;
  sortKey: string;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const active = sortField === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex max-w-full items-center gap-1 rounded text-left text-text-secondary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent"
    >
      <span>{label}</span>
      {active ? (
        sortOrder === "asc" ? (
          <ArrowUp size={14} className="shrink-0 text-green-accent" aria-hidden />
        ) : (
          <ArrowDown size={14} className="shrink-0 text-green-accent" aria-hidden />
        )
      ) : null}
    </button>
  );
}

function plainHeader(label: string) {
  return () => (
    <span className="font-medium text-text-secondary">{label}</span>
  );
}

export function createAdminProductColumns(
  deps: AdminProductTableColumnDeps,
): ColumnDef<Product, unknown>[] {
  const {
    sortField,
    sortOrder,
    onSortColumn,
    uploadingProductId,
    onEdit,
    onDelete,
    onManageImages,
    onImageUpload,
  } = deps;

  return [
    ch.accessor("partNumber", {
      id: "partNumber",
      meta: { sortKey: "partNumber" },
      header: () => (
        <SortableHeaderButton
          label="Part number"
          sortKey="partNumber"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => <PartNumberCell product={ctx.row.original} />,
      size: 200,
      minSize: 140,
      maxSize: 520,
    }),
    ch.accessor("manufacturer", {
      id: "manufacturer",
      meta: { sortKey: "manufacturer" },
      header: () => (
        <SortableHeaderButton
          label="Manufacturer"
          sortKey="manufacturer"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => (
        <span className="wrap-break-word text-text-secondary">{ctx.getValue()}</span>
      ),
      size: 180,
      minSize: 120,
      maxSize: 400,
    }),
    ch.accessor("seoSlug", {
      id: "seoSlug",
      meta: { sortKey: "seoSlug" },
      header: () => (
        <SortableHeaderButton
          label="SEO slug"
          sortKey="seoSlug"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => <SeoSlugCell product={ctx.row.original} />,
      size: 200,
      minSize: 140,
      maxSize: 480,
    }),
    ch.accessor("productSummary", {
      id: "productSummary",
      header: plainHeader("Summary"),
      cell: (ctx) => <SummaryCell product={ctx.row.original} />,
      size: 280,
      minSize: 160,
      maxSize: 720,
    }),
    ch.accessor("description", {
      id: "description",
      header: plainHeader("Description"),
      cell: (ctx) => <DescriptionCell product={ctx.row.original} />,
      size: 320,
      minSize: 180,
      maxSize: 800,
    }),
    ch.display({
      id: "specs",
      header: plainHeader("Specs"),
      cell: (ctx) => <SpecsCell product={ctx.row.original} />,
      size: 150,
      minSize: 100,
      maxSize: 320,
    }),
    ch.accessor("dateCode", {
      id: "dateCode",
      header: plainHeader("DC"),
      cell: (ctx) => (
        <span className="whitespace-nowrap text-xs text-text-secondary">
          {ctx.getValue() || "—"}
        </span>
      ),
      size: 100,
      minSize: 72,
      maxSize: 160,
    }),
    ch.accessor("condition", {
      id: "condition",
      header: plainHeader("Condition"),
      cell: (ctx) => {
        const value = ctx.getValue();
        return value ? (
          <ProductConditionBadge condition={value} variant="detail" />
        ) : (
          <span className="text-xs text-text-secondary">—</span>
        );
      },
      size: 140,
      minSize: 110,
      maxSize: 220,
    }),
    ch.accessor("isSample", {
      id: "isSample",
      header: plainHeader("Sample"),
      cell: (ctx) =>
        ctx.getValue() ? (
          <span className="inline-flex rounded-full bg-green-brand/25 px-2 py-0.5 text-xs text-green-accent">
            Sample
          </span>
        ) : (
          <span className="text-xs text-text-secondary">No</span>
        ),
      size: 96,
      minSize: 72,
      maxSize: 140,
    }),
    ch.accessor("quantity", {
      id: "quantity",
      meta: { sortKey: "quantity" },
      header: () => (
        <SortableHeaderButton
          label="Qty"
          sortKey="quantity"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => ctx.getValue().toLocaleString(),
      size: 88,
      minSize: 64,
      maxSize: 140,
    }),
    ch.accessor("ourReference", {
      id: "ourReference",
      meta: { sortKey: "ourReference" },
      header: () => (
        <SortableHeaderButton
          label="Ref"
          sortKey="ourReference"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => (
        <span className="wrap-break-word text-text-secondary">{ctx.getValue()}</span>
      ),
      size: 160,
      minSize: 100,
      maxSize: 400,
    }),
    ch.accessor("updatedAt", {
      id: "updatedAt",
      meta: { sortKey: "updatedAt" },
      header: () => (
        <SortableHeaderButton
          label="Updated"
          sortKey="updatedAt"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSortColumn}
        />
      ),
      cell: (ctx) => (
        <span className="whitespace-nowrap text-xs text-text-secondary">
          {new Date(ctx.getValue()).toLocaleDateString()}
        </span>
      ),
      size: 112,
      minSize: 96,
      maxSize: 160,
    }),
    ch.display({
      id: "images",
      header: plainHeader("Images"),
      cell: (ctx) => {
        const p = ctx.row.original;
        return (
          <ProductImagesCell
            product={p}
            uploading={uploadingProductId === p._id}
            onManageImages={() => onManageImages(p)}
            onPickImage={(file) => onImageUpload(p._id, file)}
          />
        );
      },
      size: 200,
      minSize: 200,
      maxSize: 200,
      enableResizing: false,
    }),
    ch.display({
      id: "actions",
      header: plainHeader("Actions"),
      cell: (ctx) => {
        const p = ctx.row.original;
        return (
          <ProductActionsCell
            product={p}
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p._id)}
          />
        );
      },
      size: 88,
      minSize: 88,
      maxSize: 88,
      enableResizing: false,
    }),
  ] as ColumnDef<Product, unknown>[];
}
