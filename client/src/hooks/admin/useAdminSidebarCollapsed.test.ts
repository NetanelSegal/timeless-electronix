import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminSidebarCollapsed } from "./useAdminSidebarCollapsed";

const KEY = "te-admin-sidebar-collapsed";

describe("useAdminSidebarCollapsed", () => {
  beforeEach(() => {
    localStorage.removeItem(KEY);
  });

  it("reads true from localStorage after mount", async () => {
    localStorage.setItem(KEY, "1");
    const { result } = renderHook(() => useAdminSidebarCollapsed());
    await waitFor(() => {
      expect(result.current.collapsed).toBe(true);
    });
  });

  it("toggle persists to localStorage", async () => {
    const { result } = renderHook(() => useAdminSidebarCollapsed());
    await waitFor(() => {
      expect(result.current.collapsed).toBe(false);
    });
    act(() => {
      result.current.toggle();
    });
    await waitFor(() => {
      expect(result.current.collapsed).toBe(true);
    });
    expect(localStorage.getItem(KEY)).toBe("1");
    act(() => {
      result.current.toggle();
    });
    await waitFor(() => {
      expect(result.current.collapsed).toBe(false);
    });
    expect(localStorage.getItem(KEY)).toBe("0");
  });
});
