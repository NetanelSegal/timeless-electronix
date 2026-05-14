import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, render, screen, fireEvent } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { useDebouncedSearchToUrl } from "./useDebouncedSearchToUrl";

function DebouncedSearchField() {
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  useDebouncedSearchToUrl({
    searchInput,
    urlSearch,
    searchParams,
    setSearchParams,
  });
  return (
    <div>
      <input
        aria-label="Search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <span data-testid="committed">{urlSearch}</span>
      <span data-testid="page">{searchParams.get("page") ?? ""}</span>
    </div>
  );
}

describe("useDebouncedSearchToUrl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call setSearchParams when trimmed input matches urlSearch", () => {
    const setSearchParams = vi.fn();
    renderHook(() =>
      useDebouncedSearchToUrl({
        searchInput: "  same  ",
        urlSearch: "same",
        searchParams: new URLSearchParams(),
        setSearchParams,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(setSearchParams).not.toHaveBeenCalled();
  });

  it("after delay updates search and resets page with replace", () => {
    const setSearchParams = vi.fn();
    const searchParams = new URLSearchParams("page=3&other=x");
    renderHook(() =>
      useDebouncedSearchToUrl({
        searchInput: "chip",
        urlSearch: "",
        searchParams,
        setSearchParams,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(setSearchParams).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(setSearchParams).toHaveBeenCalledTimes(1);
    const [next, opts] = setSearchParams.mock.calls[0]!;
    expect(opts).toEqual({ replace: true });
    expect(next.get("search")).toBe("chip");
    expect(next.get("page")).toBe("1");
    expect(next.get("other")).toBe("x");
  });

  it("deletes search param when trimmed input is empty", () => {
    const setSearchParams = vi.fn();
    const searchParams = new URLSearchParams("search=old&page=2");
    renderHook(() =>
      useDebouncedSearchToUrl({
        searchInput: "   ",
        urlSearch: "old",
        searchParams,
        setSearchParams,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(setSearchParams).toHaveBeenCalledOnce();
    const [next] = setSearchParams.mock.calls[0]!;
    expect(next.has("search")).toBe(false);
    expect(next.get("page")).toBe("1");
  });

  it("uses custom paramKey and delayMs", () => {
    const setSearchParams = vi.fn();
    renderHook(() =>
      useDebouncedSearchToUrl({
        searchInput: "v",
        urlSearch: "",
        searchParams: new URLSearchParams(),
        setSearchParams,
        paramKey: "q",
        delayMs: 100,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(setSearchParams).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const [next] = setSearchParams.mock.calls[0]!;
    expect(next.get("q")).toBe("v");
    expect(next.has("search")).toBe(false);
  });

  it("syncs via MemoryRouter after debounce", () => {
    render(
      <MemoryRouter initialEntries={["/?page=2"]}>
        <Routes>
          <Route path="/" element={<DebouncedSearchField />} />
        </Routes>
      </MemoryRouter>,
    );
    const input = screen.getByLabelText("Search");
    fireEvent.change(input, { target: { value: "chip" } });
    expect(screen.getByTestId("committed").textContent).toBe("");
    expect(screen.getByTestId("page").textContent).toBe("2");
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.getByTestId("committed").textContent).toBe("chip");
    expect(screen.getByTestId("page").textContent).toBe("1");
  });

  it("clears timeout on unmount so setSearchParams is not called late", () => {
    const setSearchParams = vi.fn();
    const { unmount } = renderHook(() =>
      useDebouncedSearchToUrl({
        searchInput: "late",
        urlSearch: "",
        searchParams: new URLSearchParams(),
        setSearchParams,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
