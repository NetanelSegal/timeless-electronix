import mongoose, { Schema, type Document } from "mongoose";

export interface IContactMessage extends Document {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    fullName: { type: String, required: true },
    company: { type: String, default: "" },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ContactMessage = mongoose.model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema,
);
