import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { Product } from "../models/Product.js";
import { sendQuoteNotification } from "../services/email.js";

const router = Router();

const quoteItemSchema = z.object({
  /** Identifies the exact stock lot; everything else is re-read from it. */
  productId: z.string().optional(),
  partNumber: z.string().min(1),
  manufacturer: z.string().default(""),
  quantity: z.number().int().min(1),
  // Optional so a cart saved before lot selection existed still submits.
  condition: z.string().default(""),
  dateCode: z.string().default(""),
});

// ourReference is deliberately absent: it is an internal stock locator that no
// longer reaches the browser, so it cannot be supplied by the client.

type ParsedQuoteItem = z.infer<typeof quoteItemSchema>;

/**
 * Fill each line from the product it points at. The reference is internal and
 * never leaves the server, so the client cannot send it; reading the rest from
 * the database at the same time means a submitted quote reflects the real
 * catalog rather than whatever the browser posted.
 *
 * A line whose product cannot be found keeps what the client sent, minus the
 * reference — a cart can outlive a deleted product.
 */
async function resolveQuoteItems(items: ParsedQuoteItem[]) {
  const ids = items
    .map((i) => i.productId)
    .filter((id): id is string => !!id && mongoose.Types.ObjectId.isValid(id));

  const docs = ids.length
    ? await Product.find(
        { _id: { $in: ids } },
        { partNumber: 1, manufacturer: 1, ourReference: 1, condition: 1, dateCode: 1 },
      ).lean()
    : [];
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  return items.map((item) => {
    const doc = item.productId ? byId.get(item.productId) : undefined;
    if (!doc) {
      return {
        partNumber: item.partNumber,
        manufacturer: item.manufacturer,
        quantity: item.quantity,
        ourReference: "",
        condition: item.condition,
        dateCode: item.dateCode,
      };
    }
    return {
      partNumber: String(doc.partNumber ?? item.partNumber),
      manufacturer: String(doc.manufacturer ?? ""),
      quantity: item.quantity,
      ourReference: String(doc.ourReference ?? ""),
      condition: String(doc.condition ?? ""),
      dateCode: String(doc.dateCode ?? ""),
    };
  });
}

const quoteSchema = z.object({
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().default(""),
  customerCompany: z.string().default(""),
  message: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = quoteSchema.parse(req.body);
    const data = { ...parsed, items: await resolveQuoteItems(parsed.items) };
    const quote = await QuoteRequest.create(data);

    sendQuoteNotification(data).catch((err) =>
      console.error("Email send failed:", err),
    );

    res.status(201).json({ success: true, id: quote._id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message });
      return;
    }
    next(err);
  }
});

export default router;
