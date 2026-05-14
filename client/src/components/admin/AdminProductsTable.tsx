import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { Product } from "../../lib/types";
import { useAdminProductsTableColumnSizing } from "../../hooks/admin/useAdminProductsTableColumnSizing";
import { createAdminProductColumns } from "./adminProductTableColumns";

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

function headerAriaSort(
  columnId: string,
  meta: unknown,
  sortField: string,
  sortOrder: "asc" | "desc",
): "ascending" | "descending" | "none" {
  const sortKey =
    meta && typeof meta === "object" && "sortKey" in meta
      ? String((meta as { sortKey?: string }).sortKey)
      : columnId;
  if (sortField !== sortKey) return "none";
  return sortOrder === "asc" ? "ascending" : "descending";
}

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
  const { columnSizing, onColumnSizingChange } =
    useAdminProductsTableColumnSizing();

  const columns = useMemo(
    () =>
      createAdminProductColumns({
        sortField,
        sortOrder,
        onSortColumn,
        uploadingProductId,
        onEdit,
        onDelete,
        onManageImages,
        onImageUpload,
      }),
    [
      sortField,
      sortOrder,
      onSortColumn,
      uploadingProductId,
      onEdit,
      onDelete,
      onManageImages,
      onImageUpload,
    ],
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 72,
      size: 140,
      maxSize: 640,
    },
    state: {
      columnVisibility: {
        productSummary: showSummary,
        description: showDescription,
      },
      columnSizing,
    },
    onColumnSizingChange,
  });

  return (
    <div className="max-h-[min(70vh,calc(100vh-12rem))] overflow-auto rounded-lg border border-border">
      <table
        className="w-full border-separate border-spacing-0 text-sm"
        style={{
          width: table.getTotalSize(),
          minWidth: "100%",
        }}
      >
        <caption className="sr-only">
          Product inventory. Column headers sort the table.
        </caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="text-left text-text-secondary">
              {headerGroup.headers.map((header) => {
                const colMeta = header.column.columnDef.meta;
                const ariaSort = headerAriaSort(
                  header.column.id,
                  colMeta,
                  sortField,
                  sortOrder,
                );
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    aria-sort={ariaSort}
                    style={{
                      width: header.getSize(),
                    }}
                    className="sticky top-0 z-20 border-b border-border bg-bg-secondary p-0 align-bottom font-medium"
                  >
                    <div className="flex min-h-11 items-stretch">
                      <div
                        className={`flex min-w-0 flex-1 items-end pt-2 pb-3 pl-3 ${
                          header.column.getCanResize() ? "pr-1" : "pr-3"
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>
                      {header.column.getCanResize() ? (
                        <div
                          className="relative w-3 shrink-0 touch-none self-stretch border-l border-border"
                          aria-hidden
                        >
                          <button
                            type="button"
                            aria-label={`Resize ${header.column.id} column`}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute inset-0 cursor-col-resize select-none hover:bg-green-accent/15 ${
                              header.column.getIsResizing()
                                ? "bg-green-accent/25"
                                : ""
                            }`}
                          />
                        </div>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 transition-colors hover:bg-bg-card/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className="min-w-0 px-3 py-3 align-top"
                >
                  <div className="min-w-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
