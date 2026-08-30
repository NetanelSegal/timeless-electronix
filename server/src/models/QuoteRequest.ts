import mongoose, { Schema, type Document } from "mongoose";

export interface IQuoteItem {
  partNumber: string;
  manufacturer: string;
  quantity: number;
  ourReference: string;
  /**
   * A part is quoted per stock lot: the customer can ask for 500 new and 200
   * used of the same component. Without these the line says only how many, not
   * which lot, and the reference alone does not tell the office the condition.
   */
  condition: string;
  dateCode: string;
}

export interface IQuoteRequest extends Document {
  items: IQuoteItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  message?: string;
  status: "new" | "in-progress" | "completed" | "cancelled";
  createdAt: Date;
}

const quoteItemSchema = new Schema<IQuoteItem>(
  {
    partNumber: { type: String, required: true },
    manufacturer: { type: String, default: "" },
    quantity: { type: Number, required: true },
    ourReference: { type: String, default: "" },
    condition: { type: String, default: "" },
    dateCode: { type: String, default: "" },
  },
  { _id: false },
);

const quoteRequestSchema = new Schema<IQuoteRequest>(
  {
    items: { type: [quoteItemSchema], required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    customerCompany: { type: String, default: "" },
    message: { type: String },
    status: {
      type: String,
      enum: ["new", "in-progress", "completed", "cancelled"],
      default: "new",
    },
  },
  { timestamps: true },
);

export const QuoteRequest = mongoose.model<IQuoteRequest>(
  "QuoteRequest",
  quoteRequestSchema,
);
