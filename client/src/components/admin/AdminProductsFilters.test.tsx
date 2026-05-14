import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminProductsFilters from "./AdminProductsFilters";

describe("AdminProductsFilters", () => {
  it("toggles panel via Filters button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AdminProductsFilters
        searchField=""
        manufacturer=""
        minQty=""
        maxQty=""
        isSample=""
        hasImages=""
        missingSlug=""
        open={false}
        onOpenChange={onOpenChange}
        onPatch={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /filters/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("patches searchField when scope changes", async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(
      <AdminProductsFilters
        searchField=""
        manufacturer=""
        minQty=""
        maxQty=""
        isSample=""
        hasImages=""
        missingSlug=""
        open
        onOpenChange={vi.fn()}
        onPatch={onPatch}
      />,
    );
    await waitFor(() => expect(onPatch).toHaveBeenCalled(), {
      timeout: 2000,
    });
    onPatch.mockClear();
    await user.selectOptions(
      screen.getByRole("combobox", { name: /search scope/i }),
      "partNumber",
    );
    expect(onPatch).toHaveBeenCalledWith({ searchField: "partNumber" });
  });

  it("debounces manufacturer / qty patch", async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(
      <AdminProductsFilters
        searchField=""
        manufacturer=""
        minQty=""
        maxQty=""
        isSample=""
        hasImages=""
        missingSlug=""
        open
        onOpenChange={vi.fn()}
        onPatch={onPatch}
      />,
    );
    await waitFor(() => expect(onPatch).toHaveBeenCalled(), {
      timeout: 2000,
    });
    onPatch.mockClear();
    const mfg = screen.getByPlaceholderText("e.g. Murata");
    await user.type(mfg, "Mu");
    expect(onPatch).not.toHaveBeenCalled();
    await waitFor(
      () => {
        expect(onPatch).toHaveBeenCalledWith(
          expect.objectContaining({ manufacturer: "Mu" }),
        );
      },
      { timeout: 2000 },
    );
  });
});
