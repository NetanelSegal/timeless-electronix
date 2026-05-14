import { useMemo } from "react";
import { adminApi } from "../../lib/adminApi";
import type { ProductsResponse } from "../../lib/types";
import { useAsyncQuery } from "../useAsyncQuery";
import {
  ADMIN_PAGE_SIZE,
  type AdminProductsListQuery,
} from "./useAdminProductsListState";

export function useAdminProductsQuery(listQuery: AdminProductsListQuery) {
  const depsKey = useMemo(
    () =>
      [
        listQuery.search,
        listQuery.searchField,
        listQuery.manufacturer,
        listQuery.minQty,
        listQuery.maxQty,
        listQuery.isSample,
        listQuery.hasImages,
        listQuery.missingSlug,
        listQuery.page,
        listQuery.sortField,
        listQuery.sortOrder,
      ].join("\0"),
    [listQuery],
  );

  return useAsyncQuery(
    () => {
      const params = new URLSearchParams();
      if (listQuery.search) params.set("search", listQuery.search);
      if (listQuery.searchField) params.set("searchField", listQuery.searchField);
      if (listQuery.manufacturer) params.set("manufacturer", listQuery.manufacturer);
      if (listQuery.minQty) params.set("minQty", listQuery.minQty);
      if (listQuery.maxQty) params.set("maxQty", listQuery.maxQty);
      if (listQuery.isSample) params.set("isSample", listQuery.isSample);
      if (listQuery.hasImages) params.set("hasImages", listQuery.hasImages);
      if (listQuery.missingSlug) params.set("missingSlug", listQuery.missingSlug);
      params.set("page", String(listQuery.page));
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("sort", listQuery.sortField);
      params.set("order", listQuery.sortOrder);
      return adminApi.get<ProductsResponse>(`/products?${params}`);
    },
    [depsKey],
    { showLoadingOnRefetch: true },
  );
}
