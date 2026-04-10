import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  partNumber: string;
  description: string;
  quantity: number;
  ourReference: string;
  manufacturer: string;
  dateCode: string;
  /** Canonical list in API; legacy rows may only have `imageUrl`. */
  imageUrls: string[];
  /** @deprecated Legacy single image; merged into `imageUrls` on read. */
  imageUrl?: string;
  isSample: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    partNumber: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    ourReference: { type: String, default: "" },
    manufacturer: { type: String, default: "", index: true },
    dateCode: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
    imageUrl: { type: String },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ partNumber: "text", manufacturer: "text" });

export const Product = mongoose.model<IProduct>("Product", productSchema);
