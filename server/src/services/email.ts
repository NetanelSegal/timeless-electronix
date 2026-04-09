import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface ContactData {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}

interface QuoteData {
  items: { partNumber: string; manufacturer: string; quantity: number; ourReference: string }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  message?: string;
}

export async function sendContactNotification(data: ContactData) {
  if (!resend) {
    console.log("[Email] Resend not configured, skipping contact notification");
    return;
  }

  await resend.emails.send({
    from: "Timeless Electronix <noreply@timeless-electronix.com>",
    to: env.NOTIFICATION_EMAIL,
    subject: `New Contact Message from ${data.fullName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.fullName}</p>
      <p><strong>Company:</strong> ${data.company || "N/A"}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
      <hr/>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    `,
  });
}

export async function sendQuoteNotification(data: QuoteData) {
  if (!resend) {
    console.log("[Email] Resend not configured, skipping quote notification");
    return;
  }

  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.partNumber}</td>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.manufacturer}</td>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.quantity.toLocaleString()}</td>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.ourReference}</td>
        </tr>`,
    )
    .join("");

  await resend.emails.send({
    from: "Timeless Electronix <noreply@timeless-electronix.com>",
    to: env.NOTIFICATION_EMAIL,
    subject: `New Quote Request from ${data.customerName} (${data.items.length} items)`,
    html: `
      <h2>New Quote Request</h2>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Company:</strong> ${data.customerCompany || "N/A"}</p>
      <p><strong>Email:</strong> ${data.customerEmail}</p>
      <p><strong>Phone:</strong> ${data.customerPhone || "N/A"}</p>
      ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
      <hr/>
      <h3>Requested Items (${data.items.length})</h3>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#2d5a3d;color:white">
            <th style="padding:6px 8px;text-align:left">Part Number</th>
            <th style="padding:6px 8px;text-align:left">Manufacturer</th>
            <th style="padding:6px 8px;text-align:left">Qty</th>
            <th style="padding:6px 8px;text-align:left">Reference</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    `,
  });
}
