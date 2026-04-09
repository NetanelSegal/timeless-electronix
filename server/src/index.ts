import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import productRoutes from "./routes/products.js";
import contactRoutes from "./routes/contact.js";
import quoteRoutes from "./routes/quotes.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

start();

export default app;
