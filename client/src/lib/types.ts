import type { ProductCondition } from "./productCondition";

export interface Product {
  _id: string;
  partNumber: string;
  description: string;
  quantity: number;
  ourReference: string;
  manufacturer: string;
  dateCode: string;
  condition: ProductCondition;
  seoSlug: string;
  productSummary: string;
  technicalSpecs?: Record<string, string | number | boolean>;
  imageUrls: string[];
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Group fields, present only on the detail endpoint. Every lot of a part
   * canonicalises to one URL so the lots do not compete with each other in
   * search; the page still renders the lot that was requested.
   */
  canonicalSeoSlug?: string;
  isCanonical?: boolean;
  lots?: ProductLot[];
  /** Display names across the group; more than one for OEM cross-brands. */
  manufacturers?: string[];
}

/**
 * One stock lot of a part: same component, different intake. Lots differ by
 * quantity and internal reference, often by date code, and rarely by
 * condition. Only the product detail response carries them.
 */
export interface ProductLot {
  _id: string;
  seoSlug: string;
  manufacturer: string;
  condition: ProductCondition | "";
  quantity: number;
  dateCode: string;
  ourReference: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ContactFormData {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}

export interface QuoteItem {
  productId: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  ourReference: string;
  /**
   * A part is quoted per stock lot, so the same component can appear twice in
   * one cart — 500 new and 200 used. These say which lot each line is for.
   */
  condition: ProductCondition | "";
  dateCode: string;
}

/** Line item as stored on a submitted quote (no catalog productId). */
export interface QuoteRequestLine {
  partNumber: string;
  manufacturer: string;
  quantity: number;
  ourReference: string;
  condition?: string;
  dateCode?: string;
}

export interface QuoteSubmission {
  items: QuoteItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  message?: string;
}

export interface QuoteRequest {
  _id: string;
  items: QuoteRequestLine[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  message?: string;
  status: "new" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalProducts: number;
  totalQuotes: number;
  newQuotes: number;
  unreadMessages: number;
}
