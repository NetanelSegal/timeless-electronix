export interface Product {
  _id: string;
  partNumber: string;
  description: string;
  quantity: number;
  ourReference: string;
  manufacturer: string;
  dateCode: string;
  imageUrl?: string;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
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
  items: QuoteItem[];
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
