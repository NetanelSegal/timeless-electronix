import mongoose from "mongoose";
import { env } from "./env.js";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

/**
 * Connect to MongoDB, retrying indefinitely with capped exponential backoff.
 *
 * This deliberately does not exit the process. The HTTP server listens
 * independently of the database, so a transient Mongo outage degrades the API
 * to 5xx instead of taking the port down and turning every page on the site
 * into an Apache 503.
 */
export async function connectDB(): Promise<void> {
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  for (let attempt = 0; ; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
      console.error(
        `MongoDB connection error (attempt ${attempt + 1}), retrying in ${delay}ms:`,
        err,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/** True once the driver has an live connection. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
