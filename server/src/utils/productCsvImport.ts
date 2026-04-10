import mongoose from "mongoose";

/** Row from admin CSV import (camelCase or legacy snake_case columns). */
export type ProductCsvRow = Record<string, string | undefined>;

export function productDocFromCsvRow(row: ProductCsvRow): Record<string, unknown> {
  const partNumber = String(row.partNumber ?? row.part_number ?? "").trim();
  const description = String(row.description ?? "");
  const quantity = parseInt(String(row.quantity ?? ""), 10) || 0;
  const ourReference = String(row.ourReference ?? row.our_reference ?? "").trim();
  const manufacturer = String(row.manufacturer ?? row.mfg ?? "").trim();
  const dateCode = String(row.dateCode ?? row.date_code ?? "").trim();
  const idStr = String(row._id ?? row.id ?? "").trim();
  const urlsRaw = String(row.imageUrls ?? row.image_urls ?? "").trim();
  const imageUrls = urlsRaw
    ? urlsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const doc: Record<string, unknown> = {
    partNumber,
    description,
    quantity,
    ourReference,
    manufacturer,
    dateCode,
    isSample:
      String(row.isSample ?? row.is_sample ?? "")
        .trim()
        .toLowerCase() === "true",
  };

  if (imageUrls.length) doc.imageUrls = imageUrls;
  if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
    doc._id = new mongoose.Types.ObjectId(idStr);
  }

  const createdAtStr = String(
    row.createdAt ?? row.created_at ?? row.created_date ?? "",
  ).trim();
  const updatedAtStr = String(
    row.updatedAt ?? row.updated_at ?? row.updated_date ?? "",
  ).trim();
  if (createdAtStr) {
    const d = new Date(createdAtStr);
    if (!Number.isNaN(d.getTime())) doc.createdAt = d;
  }
  if (updatedAtStr) {
    const d = new Date(updatedAtStr);
    if (!Number.isNaN(d.getTime())) doc.updatedAt = d;
  }

  return doc;
}
