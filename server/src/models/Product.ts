import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  partNumber: string;
  description: string;
  quantity: number;
  ourReference: string;
  manufacturer: string;
  dateCode: string;
  condition: 'New/Standard' | 'Used' | 'Refurbished' | 'Broken';
  /** URL segment for public catalog detail; unique. */
  seoSlug: string;
  /** Short copy for meta description / previews. */
  productSummary: string;
  /** Key/value specs (e.g. Type, Capacitance); stored as object in MongoDB. */
  technicalSpecs?: Record<string, unknown>;
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
    condition: {
      type: String,
      enum: ['New/Standard', 'Used', 'Refurbished', 'Broken'],
      default: 'New/Standard'
    },
    seoSlug: { type: String, required: true, unique: true, index: true },
    productSummary: { type: String, default: "" },
    technicalSpecs: { type: Schema.Types.Mixed },
    imageUrls: { type: [String], default: [] },
    imageUrl: { type: String },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ partNumber: "text", manufacturer: "text" });

export const Product = mongoose.model<IProduct>("Product", productSchema);
