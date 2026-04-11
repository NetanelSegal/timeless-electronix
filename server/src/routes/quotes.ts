import { Router } from "express";
import { z } from "zod";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { sendQuoteNotification } from "../services/email.js";

const router = Router();

const quoteItemSchema = z.object({
  partNumber: z.string().min(1),
  manufacturer: z.string().default(""),
  quantity: z.number().int().min(1),
  ourReference: z.string().default(""),
});

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
    const data = quoteSchema.parse(req.body);
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
