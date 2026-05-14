import { ArrowUp, ArrowDown } from "lucide-react";
import type { Product } from "../../lib/types";
import AdminProductTableRow from "./AdminProductTableRow";

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
      className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border"
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

type Props = {
  products: Product[];
  sortField: string;
  sortOrder: "asc" | "desc";
  onSortColumn: (field: string) => void;
  showSummary: boolean;
  showDescription: boolean;
  uploadingProductId: string | null;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onManageImages: (p: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
};

export default function AdminProductsTable({
  products,
  sortField,
  sortOrder,
  onSortColumn,
  showSummary,
  showDescription,
  uploadingProductId,
  onEdit,
  onDelete,
  onManageImages,
  onImageUpload,
}: Props) {
  return (
    <div className="max-h-[min(70vh,calc(100vh-12rem))] overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm min-w-[72rem]">
        <caption className="sr-only">
          Product inventory. Column headers sort the table.
        </caption>
        <thead>
          <tr className="text-left text-text-secondary">
            <SortableTh
              field="partNumber"
              label="Part number"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            <SortableTh
              field="seoSlug"
              label="SEO slug"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            {showSummary ? (
              <th
                scope="col"
                className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border max-w-[14rem]"
              >
                Summary
              </th>
            ) : null}
            {showDescription ? (
              <th
                scope="col"
                className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border max-w-[16rem]"
              >
                Description
              </th>
            ) : null}
            <th
              scope="col"
              className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border"
            >
              Specs
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border"
            >
              DC
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border"
            >
              Sample
            </th>
            <SortableTh
              field="manufacturer"
              label="Mfr"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            <SortableTh
              field="quantity"
              label="Qty"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            <SortableTh
              field="ourReference"
              label="Ref"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            <SortableTh
              field="updatedAt"
              label="Updated"
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortColumn}
            />
            <th
              scope="col"
              className="sticky top-0 z-10 bg-bg-secondary pb-3 pr-4 font-medium align-bottom border-b border-border"
            >
              Images
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 bg-bg-secondary pb-3 font-medium align-bottom border-b border-border"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <AdminProductTableRow
              key={p._id}
              product={p}
              showSummary={showSummary}
              showDescription={showDescription}
              uploading={uploadingProductId === p._id}
              onEdit={() => onEdit(p)}
              onDelete={() => onDelete(p._id)}
              onManageImages={() => onManageImages(p)}
              onPickImage={(file) => onImageUpload(p._id, file)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
