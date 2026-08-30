import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductLots from "./ProductLots";
import type { Product, ProductLot, QuoteItem } from "../lib/types";

const lot = (over: Partial<ProductLot> = {}): ProductLot => ({
  _id: "lot-1",
  seoSlug: "avx-x",
  manufacturer: "AVX",
  condition: "New/Standard",
  quantity: 4000,
  dateCode: "716",
  ...over,
});

const product = (over: Partial<Product> = {}): Product => ({
  _id: "lot-1",
  partNumber: "06035A1R2BAT2A",
  description: "",
  quantity: 4000,
  ourReference: "NB808/28",
  manufacturer: "AVX",
  dateCode: "716",
  condition: "New/Standard",
  seoSlug: "avx-x",
  productSummary: "",
  imageUrls: [],
  isSample: false,
  createdAt: "",
  updatedAt: "",
  ...over,
});

function renderLots(opts: {
  lots: ProductLot[];
  items?: QuoteItem[];
  product?: Product;
  addItem?: (i: QuoteItem) => void;
  updateQuantity?: (id: string, q: number) => void;
}) {
  const addItem = opts.addItem ?? vi.fn();
  const updateQuantity = opts.updateQuantity ?? vi.fn();
  render(
    <MemoryRouter>
      <ProductLots
        product={opts.product ?? product()}
        lots={opts.lots}
        items={opts.items ?? []}
        addItem={addItem}
        updateQuantity={updateQuantity}
      />
    </MemoryRouter>,
  );
  return { addItem, updateQuantity };
}

describe("ProductLots", () => {
  it("adds the chosen quantity from the chosen lot", async () => {
    const user = userEvent.setup();
    const { addItem } = renderLots({
      lots: [
        lot(),
        lot({ _id: "lot-2", seoSlug: "avx-x-2", condition: "Used", quantity: 960, dateCode: "705" }),
      ],
    });

    const usedRow = screen.getByText("Used").closest("tr")!;
    const input = within(usedRow).getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "250");
    await user.click(within(usedRow).getByRole("button", { name: /add/i }));

    expect(addItem).toHaveBeenCalledWith({
      productId: "lot-2",
      partNumber: "06035A1R2BAT2A",
      manufacturer: "AVX",
      quantity: 250,
      condition: "Used",
      dateCode: "705",
    });
  });

  it("updates instead of duplicating a lot already in the quote", async () => {
    const user = userEvent.setup();
    const { addItem, updateQuantity } = renderLots({
      lots: [lot()],
      items: [
        {
          productId: "lot-1",
          partNumber: "06035A1R2BAT2A",
          manufacturer: "AVX",
          quantity: 10,
          condition: "New/Standard",
          dateCode: "716",
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: /update/i }));
    expect(addItem).not.toHaveBeenCalled();
    expect(updateQuantity).toHaveBeenCalledWith("lot-1", 10);
  });

  it("hides the manufacturer column when every lot agrees", () => {
    renderLots({ lots: [lot(), lot({ _id: "lot-2" })] });
    expect(screen.queryByRole("columnheader", { name: "Manufacturer" })).toBeNull();
  });

  it("shows the manufacturer column for an OEM cross-brand", () => {
    renderLots({
      product: product({ manufacturers: ["HP", "Lenovo"] }),
      lots: [
        lot({ manufacturer: "HP" }),
        lot({ _id: "lot-2", manufacturer: "Lenovo" }),
      ],
    });
    expect(screen.getByRole("columnheader", { name: "Manufacturer" })).toBeTruthy();
  });

  it("hides the date code column when no lot has one", () => {
    renderLots({ lots: [lot({ dateCode: "" }), lot({ _id: "lot-2", dateCode: "" })] });
    expect(screen.queryByRole("columnheader", { name: "Date code" })).toBeNull();
  });

  it("never shows an internal stock reference", () => {
    renderLots({ lots: [lot(), lot({ _id: "lot-2", condition: "Used" })] });
    expect(screen.queryByRole("columnheader", { name: "Ref" })).toBeNull();
    expect(screen.queryByText(/NB\d+\//)).toBeNull();
  });

});
