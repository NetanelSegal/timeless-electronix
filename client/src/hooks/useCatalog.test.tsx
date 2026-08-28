import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

const get = vi.fn();
vi.mock("../lib/api", () => ({
  apiUrl: "/api",
  api: { get: (...args: unknown[]) => get(...args) },
}));

const { useCatalog } = await import("./useCatalog");

function wrapperFor(initialUrl: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;
  };
}

function useCatalogWithLocation() {
  return { catalog: useCatalog(), location: useLocation() };
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ products: [], total: 480, page: 1, totalPages: 20 });
});

describe("useCatalog", () => {
  it("reads the page from the URL", async () => {
    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapperFor("/catalog?page=3"),
    });
    expect(result.current.page).toBe(3);
  });

  // Regression: the filter inputs fire one debounced patch on mount. When that
  // patch changes nothing it must not reset the page, or every direct load of
  // /catalog?page=N — a crawler walking the series included — lands on page 1.
  it("keeps the current page when a patch changes nothing", async () => {
    const { result } = renderHook(() => useCatalogWithLocation(), {
      wrapper: wrapperFor("/catalog?page=3"),
    });

    act(() => {
      result.current.catalog.patchParams({
        manufacturer: undefined,
        minQty: undefined,
        maxQty: undefined,
      });
    });

    expect(result.current.catalog.page).toBe(3);
    expect(result.current.location.search).not.toContain("page=1");
  });

  it("resets to page 1 when a patch actually changes a filter", async () => {
    const { result } = renderHook(() => useCatalogWithLocation(), {
      wrapper: wrapperFor("/catalog?page=3"),
    });

    act(() => {
      result.current.catalog.patchParams({ manufacturer: "3COM" });
    });

    await waitFor(() => expect(result.current.catalog.page).toBe(1));
    expect(result.current.location.search).toContain("manufacturer=3COM");
  });

  it("builds page hrefs that preserve active filters", () => {
    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapperFor("/catalog?manufacturer=3COM&page=2"),
    });

    const href = result.current.pageHref(5);
    expect(href).toContain("manufacturer=3COM");
    expect(href).toContain("page=5");
  });

  it("surfaces a load error instead of an empty result set", async () => {
    get.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapperFor("/catalog"),
    });

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.products).toBeNull();
  });
});
